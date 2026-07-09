import React from 'react'
import { Facebook, Heart, MessageCircle, Share2, Youtube, Play } from 'lucide-react'

// Custom TikTok icon for previews
const TikTokIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

function PostPreview({ platform, title, description, tags, mediaFile, username = 'CreatorStudio' }) {
  
  const getMediaUrl = () => {
    if (mediaFile) {
      return URL.createObjectURL(mediaFile)
    }
    return null
  }

  const renderFacebookPreview = () => {
    const mediaUrl = getMediaUrl()
    return (
      <div className="fb-mock-post">
        <div className="fb-mock-header">
          <div className="platform-avatar-fallback" style={{ width: '36px', height: '36px', background: '#1877F2', fontSize: '0.9rem' }}>F</div>
          <div>
            <div className="fb-mock-name">{username}</div>
            <div className="fb-mock-date">Just now • 🌐</div>
          </div>
        </div>
        <div className="fb-mock-text">
          {description || 'Write something amazing in the description box...'}
          {tags && <span style={{ color: '#2b6cb0', display: 'block', marginTop: '4px' }}>{tags}</span>}
        </div>
        {mediaUrl ? (
          mediaFile.type.startsWith('image/') ? (
            <img src={mediaUrl} alt="FB Mock Media" className="fb-mock-media" />
          ) : (
            <video src={mediaUrl} className="fb-mock-media" muted />
          )
        ) : (
          <div className="fb-mock-media" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#242526', color: 'rgba(255,255,255,0.2)' }}>
            No Media Selected
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #3e4042', marginTop: '12px', paddingTop: '8px', color: '#b0b3b8', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={16} /> Like</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={16} /> Comment</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Share2 size={16} /> Share</span>
        </div>
      </div>
    )
  }

  const renderYouTubePreview = () => {
    const mediaUrl = getMediaUrl()
    const isVideo = mediaFile && mediaFile.type.startsWith('video/')
    return (
      <div className="yt-mock-card">
        <div className="yt-mock-thumbnail">
          {mediaUrl && isVideo ? (
            <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
          ) : mediaUrl ? (
            <img src={mediaUrl} alt="YT Mock Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#212121', color: 'rgba(255,255,255,0.2)', gap: '8px' }}>
              <Play size={32} />
              <span>Video Thumbnail</span>
            </div>
          )}
          <div className="yt-mock-duration">0:45</div>
        </div>
        <div className="yt-mock-details">
          <div className="platform-avatar-fallback" style={{ width: '36px', height: '36px', background: '#FF0000', flexShrink: 0, fontSize: '0.9rem' }}>Y</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="yt-mock-title">{title || 'Video Title Goes Here...'}</div>
            <div className="yt-mock-metadata">
              <div>{username}</div>
              <div>0 views • Just now</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTikTokPreview = () => {
    const mediaUrl = getMediaUrl()
    const isVideo = mediaFile && mediaFile.type.startsWith('video/')
    
    return (
      <div className="mock-phone-frame">
        <div className="tt-mock-screen">
          {mediaUrl && isVideo ? (
            <video src={mediaUrl} className="tt-mock-video" autoPlay loop muted />
          ) : mediaUrl ? (
            <img src={mediaUrl} alt="TT Mock Image" className="tt-mock-video" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'rgba(255,255,255,0.2)', gap: '8px' }}>
              <FileVideo size={48} />
              <span>Vertical Video Upload</span>
            </div>
          )}

          <div className="tt-mock-sidebar">
            <div className="tt-mock-action">
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold' }}>T</div>
            </div>
            <div className="tt-mock-action">
              <Heart size={28} fill="currentColor" />
              <span>0</span>
            </div>
            <div className="tt-mock-action">
              <MessageCircle size={28} fill="currentColor" />
              <span>0</span>
            </div>
            <div className="tt-mock-action">
              <Share2 size={28} fill="currentColor" />
              <span>0</span>
            </div>
          </div>

          <div className="tt-mock-overlay">
            <div className="tt-mock-username">@{username.toLowerCase()}</div>
            <div className="tt-mock-description">
              {description || 'Write your caption...'} {tags || '#trending #shorts'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {platform === 'facebook' && <Facebook size={18} color="#1877F2" />}
          {platform === 'youtube' && <Youtube size={18} color="#FF0000" />}
          {platform === 'tiktok' && <TikTokIcon size={18} color="#00F2EA" />}
          <span>{platform.toUpperCase()} PREVIEW</span>
        </h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ width: '100%' }}>
          {platform === 'facebook' && renderFacebookPreview()}
          {platform === 'youtube' && renderYouTubePreview()}
          {platform === 'tiktok' && renderTikTokPreview()}
        </div>
      </div>
    </div>
  )
}

import { FileVideo } from 'lucide-react'
export default PostPreview
