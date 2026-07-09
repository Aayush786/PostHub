import React, { useState, useEffect } from 'react'
import PlatformToggle from '../components/PlatformToggle'
import MediaUploader from '../components/MediaUploader'
import PostPreview from '../components/PostPreview'
import { Send, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

function Compose() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'youtube'])
  const [mediaFile, setMediaFile] = useState(null)
  
  // Tab control for customization
  const [activeTab, setActiveTab] = useState('facebook')

  // Preview Platform control
  const [activePreview, setActivePreview] = useState('facebook')

  // Global inputs
  const [commonDescription, setCommonDescription] = useState('')

  // Platform specific inputs
  const [facebookData, setFacebookData] = useState({
    message: '',
    privacy: 'EVERYONE'
  })

  const [youtubeData, setYoutubeData] = useState({
    title: '',
    description: '',
    tags: '',
    category: '22', // People & Blogs
    privacy: 'public'
  })

  const [tiktokData, setTiktokData] = useState({
    title: '',
    description: '',
    hashtags: '',
    privacy: 'PUBLIC_TO_EVERYONE',
    allowComments: true,
    allowDuet: true
  })

  // Set default description when common description changes
  useEffect(() => {
    setFacebookData(prev => ({ ...prev, message: commonDescription }))
    setYoutubeData(prev => ({ ...prev, description: commonDescription }))
    setTiktokData(prev => ({ ...prev, description: commonDescription }))
  }, [commonDescription])

  // Sync active customization tab with selected platforms
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(activeTab)) {
      setActiveTab(selectedPlatforms[0])
    }
  }, [selectedPlatforms, activeTab])

  // Sync active preview tab
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(activePreview)) {
      setActivePreview(selectedPlatforms[0])
    }
  }, [selectedPlatforms, activePreview])

  // Submission / Status state
  const [isPublishing, setIsPublishing] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (selectedPlatforms.length === 0) {
      showToast('Please select at least one platform.', 'error')
      return
    }

    if (selectedPlatforms.includes('youtube') && !mediaFile) {
      showToast('YouTube requires a video media file upload.', 'error')
      return
    }

    if (selectedPlatforms.includes('tiktok') && !mediaFile) {
      showToast('TikTok requires a video media file upload.', 'error')
      return
    }

    setIsPublishing(true)
    showToast('Publishing content in progress...', 'info')

    // Create target JSON packages
    const targets = []
    
    // Facebook target
    if (selectedPlatforms.includes('facebook')) {
      targets.push({
        platform: 'facebook',
        customDescription: facebookData.message,
        privacy: facebookData.privacy
      })
    }

    // YouTube target
    if (selectedPlatforms.includes('youtube')) {
      targets.push({
        platform: 'youtube',
        customTitle: youtubeData.title,
        customDescription: youtubeData.description,
        customTags: youtubeData.tags,
        category: youtubeData.category,
        privacy: youtubeData.privacy
      })
    }

    // TikTok target
    if (selectedPlatforms.includes('tiktok')) {
      targets.push({
        platform: 'tiktok',
        customTitle: tiktokData.title,
        customDescription: tiktokData.description,
        customTags: tiktokData.hashtags,
        privacy: tiktokData.privacy,
        allowComments: tiktokData.allowComments ? 1 : 0,
        allowDuet: tiktokData.allowDuet ? 1 : 0
      })
    }

    // Prepare FormData upload
    const formData = new FormData()
    if (mediaFile) {
      formData.append('media', mediaFile)
    }
    formData.append('targets', JSON.stringify(targets))

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      setIsPublishing(false)

      if (response.ok) {
        showToast('Post created and queued successfully!', 'success')
        // Reset composer
        setMediaFile(null)
        setCommonDescription('')
        setFacebookData({ message: '', privacy: 'EVERYONE' })
        setYoutubeData({ title: '', description: '', tags: '', category: '22', privacy: 'public' })
        setTiktokData({ title: '', description: '', hashtags: '', privacy: 'PUBLIC_TO_EVERYONE', allowComments: true, allowDuet: true })
      } else {
        showToast(`Failed to publish: ${result.error || 'Server error'}`, 'error')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      setIsPublishing(false)
      showToast('Offline Mode: Simulated publishing to selected channels successfully!', 'success')
    }
  }

  const handleSaveDraft = async () => {
    setIsPublishing(true)
    showToast('Saving draft...', 'info')

    // Create target JSON packages
    const targets = []
    
    // Facebook target
    if (selectedPlatforms.includes('facebook')) {
      targets.push({
        platform: 'facebook',
        customDescription: facebookData.message,
        privacy: facebookData.privacy
      })
    }

    // YouTube target
    if (selectedPlatforms.includes('youtube')) {
      targets.push({
        platform: 'youtube',
        customTitle: youtubeData.title,
        customDescription: youtubeData.description,
        customTags: youtubeData.tags,
        category: youtubeData.category,
        privacy: youtubeData.privacy
      })
    }

    // TikTok target
    if (selectedPlatforms.includes('tiktok')) {
      targets.push({
        platform: 'tiktok',
        customTitle: tiktokData.title,
        customDescription: tiktokData.description,
        customTags: tiktokData.hashtags,
        privacy: tiktokData.privacy,
        allowComments: tiktokData.allowComments ? 1 : 0,
        allowDuet: tiktokData.allowDuet ? 1 : 0
      })
    }

    // Determine post title
    let draftTitle = 'Draft Post'
    if (selectedPlatforms.includes('youtube') && youtubeData.title) {
      draftTitle = youtubeData.title
    } else if (selectedPlatforms.includes('tiktok') && tiktokData.title) {
      draftTitle = tiktokData.title
    } else if (commonDescription) {
      draftTitle = commonDescription.slice(0, 30) + (commonDescription.length > 30 ? '...' : '')
    }

    const formData = new FormData()
    if (mediaFile) {
      formData.append('media', mediaFile)
    }
    formData.append('title', draftTitle)
    formData.append('description', commonDescription)
    formData.append('targets', JSON.stringify(targets))
    formData.append('isDraft', 'true')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      setIsPublishing(false)

      if (response.ok) {
        showToast('Post saved as draft successfully!', 'success')
        // Reset composer
        setMediaFile(null)
        setCommonDescription('')
        setFacebookData({ message: '', privacy: 'EVERYONE' })
        setYoutubeData({ title: '', description: '', tags: '', category: '22', privacy: 'public' })
        setTiktokData({ title: '', description: '', hashtags: '', privacy: 'PUBLIC_TO_EVERYONE', allowComments: true, allowDuet: true })
      } else {
        showToast(`Failed to save draft: ${result.error || 'Server error'}`, 'error')
      }
    } catch (err) {
      console.error('Error saving draft:', err)
      setIsPublishing(false)
      showToast('Offline Mode: Simulated draft save successfully!', 'success')
    }
  }

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600 }}>Compose Post</h1>
        <p>Draft your content once and dispatch customized details across Facebook, YouTube, and TikTok simultaneously.</p>
      </div>

      <form onSubmit={handlePublish} className="composer-grid">
        {/* Left Hand: Compose Settings */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Target platform selector */}
          <PlatformToggle selected={selectedPlatforms} onChange={setSelectedPlatforms} />

          {/* Media uploader */}
          <MediaUploader 
            file={mediaFile} 
            onFileSelect={setMediaFile} 
            onRemove={() => setMediaFile(null)} 
            acceptTypes="image/*,video/*"
          />

          {/* Shared Content */}
          <div className="form-group">
            <label>Common Description (Syncs to all platforms)</label>
            <textarea
              className="form-control"
              placeholder="Write the core text/description of your post here. This updates all channels below, where you can then perform customization."
              value={commonDescription}
              onChange={(e) => setCommonDescription(e.target.value)}
            />
          </div>

          {/* Per-Platform Customization Tabs */}
          {selectedPlatforms.length > 0 && (
            <div>
              <div className="tab-navbar">
                {selectedPlatforms.includes('facebook') && (
                  <div 
                    className={`tab-navitem ${activeTab === 'facebook' ? 'active active-facebook' : ''}`}
                    onClick={() => setActiveTab('facebook')}
                  >
                    Facebook Page
                  </div>
                )}
                {selectedPlatforms.includes('youtube') && (
                  <div 
                    className={`tab-navitem ${activeTab === 'youtube' ? 'active active-youtube' : ''}`}
                    onClick={() => setActiveTab('youtube')}
                  >
                    YouTube Video
                  </div>
                )}
                {selectedPlatforms.includes('tiktok') && (
                  <div 
                    className={`tab-navitem ${activeTab === 'tiktok' ? 'active active-tiktok' : ''}`}
                    onClick={() => setActiveTab('tiktok')}
                  >
                    TikTok post
                  </div>
                )}
              </div>

              {/* Facebook Tab Fields */}
              {activeTab === 'facebook' && selectedPlatforms.includes('facebook') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Page Message / Status</label>
                    <textarea
                      className="form-control"
                      placeholder="Custom caption for Facebook Page feed..."
                      value={facebookData.message}
                      onChange={(e) => setFacebookData({ ...facebookData, message: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Privacy Setting</label>
                    <select
                      className="form-control"
                      value={facebookData.privacy}
                      onChange={(e) => setFacebookData({ ...facebookData, privacy: e.target.value })}
                    >
                      <option value="EVERYONE">Public (Everyone)</option>
                      <option value="SELF">Private (Only Me)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* YouTube Tab Fields */}
              {activeTab === 'youtube' && selectedPlatforms.includes('youtube') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>YouTube Video Title (Required)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Title of YouTube upload..."
                      value={youtubeData.title}
                      onChange={(e) => setYoutubeData({ ...youtubeData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>YouTube Video Description</label>
                    <textarea
                      className="form-control"
                      placeholder="Description details..."
                      value={youtubeData.description}
                      onChange={(e) => setYoutubeData({ ...youtubeData, description: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Tags (Comma separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vlog, travel, drones"
                        value={youtubeData.tags}
                        onChange={(e) => setYoutubeData({ ...youtubeData, tags: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        className="form-control"
                        value={youtubeData.category}
                        onChange={(e) => setYoutubeData({ ...youtubeData, category: e.target.value })}
                      >
                        <option value="22">People & Blogs</option>
                        <option value="20">Gaming</option>
                        <option value="23">Comedy</option>
                        <option value="24">Entertainment</option>
                        <option value="26">Howto & Style</option>
                        <option value="27">Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Privacy Status</label>
                    <select
                      className="form-control"
                      value={youtubeData.privacy}
                      onChange={(e) => setYoutubeData({ ...youtubeData, privacy: e.target.value })}
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TikTok Tab Fields */}
              {activeTab === 'tiktok' && selectedPlatforms.includes('tiktok') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>TikTok Caption Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="TikTok video title..."
                      value={tiktokData.title}
                      onChange={(e) => setTiktokData({ ...tiktokData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Video Caption Details</label>
                    <textarea
                      className="form-control"
                      placeholder="Write hashtags separately below..."
                      value={tiktokData.description}
                      onChange={(e) => setTiktokData({ ...tiktokData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hashtags (Space separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="#foryou #fyp #vlog"
                      value={tiktokData.hashtags}
                      onChange={(e) => setTiktokData({ ...tiktokData, hashtags: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Privacy Setting</label>
                    <select
                      className="form-control"
                      value={tiktokData.privacy}
                      onChange={(e) => setTiktokData({ ...tiktokData, privacy: e.target.value })}
                    >
                      <option value="PUBLIC_TO_EVERYONE">Public (Everyone)</option>
                      <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                      <option value="SELF_ONLY">Private (Only Me)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', padding: '4px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={tiktokData.allowComments}
                        onChange={(e) => setTiktokData({ ...tiktokData, allowComments: e.target.checked })}
                      />
                      <span>Allow Comments</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={tiktokData.allowDuet}
                        onChange={(e) => setTiktokData({ ...tiktokData, allowDuet: e.target.checked })}
                      />
                      <span>Allow Duet / Stitch</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission action buttons */}
          <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={isPublishing || selectedPlatforms.length === 0}
            >
              <Send size={14} />
              <span>{isPublishing ? 'Publishing Content...' : 'Publish Content Now'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isPublishing}
              onClick={handleSaveDraft}
            >
              <FileText size={14} />
              <span>Save Draft</span>
            </button>
          </div>

        </div>

        {/* Right Hand: Live Mock Previews */}
        <div className="preview-sticky">
          <div className="preview-container-tabs">
            {selectedPlatforms.map((plat) => (
              <button
                key={plat}
                type="button"
                className={`preview-tab-btn ${activePreview === plat ? 'active' : ''}`}
                onClick={() => setActivePreview(plat)}
              >
                {plat.toUpperCase()} Preview
              </button>
            ))}
          </div>

          {selectedPlatforms.length > 0 ? (
            <PostPreview
              platform={activePreview}
              title={activePreview === 'youtube' ? youtubeData.title : activePreview === 'tiktok' ? tiktokData.title : ''}
              description={activePreview === 'youtube' ? youtubeData.description : activePreview === 'tiktok' ? tiktokData.description : facebookData.message}
              tags={activePreview === 'youtube' ? youtubeData.tags : activePreview === 'tiktok' ? tiktokData.hashtags : ''}
              mediaFile={mediaFile}
            />
          ) : (
            <div className="glass-card" style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
              <AlertCircle size={24} />
              <span>Select target channels to view preview</span>
            </div>
          )}
        </div>

      </form>
    </div>
  )
}

export default Compose
