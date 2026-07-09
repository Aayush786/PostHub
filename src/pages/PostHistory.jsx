import React, { useState, useEffect } from 'react'
import { Search, Facebook, Youtube, Calendar, Eye, Heart, AlertCircle, Trash2, ExternalLink } from 'lucide-react'

const TikTokIcon = ({ size = 12, color = 'currentColor' }) => (
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

function PostHistory() {
  const [posts, setPosts] = useState([
    { id: '1', title: 'Top 10 Hidden Gems in Switzerland 🇨🇭', description: 'Exploring the beauty of the Alps, hidden valleys, and crystal clear lakes.', mediaPath: '', mediaType: 'video/mp4', date: '2026-07-08', platforms: ['facebook', 'youtube'], status: 'published', views: '28.4K', likes: '1.2K' },
    { id: '2', title: 'How to Pack Light for 2 Weeks in Asia', description: 'My ultimate minimalist packing guide for summer travels.', mediaPath: '', mediaType: 'video/mp4', date: '2026-07-06', platforms: ['facebook', 'tiktok'], status: 'published', views: '45.1K', likes: '3.8K' },
    { id: '3', title: 'A Day in Venice: Vlog and Best Pizza Spots 🍕', description: 'Exploring the canals, hidden alleyways, and of course, testing local food!', mediaPath: '', mediaType: 'video/mp4', date: '2026-07-04', platforms: ['youtube'], status: 'published', views: '12.8K', likes: '820' },
    { id: '4', title: 'Unboxing the Ultimate Travel Drone (4K)', description: 'First tests and review of the new drone. Cinematic footage included.', mediaPath: '', mediaType: 'video/mp4', date: '2026-07-02', platforms: ['facebook', 'youtube', 'tiktok'], status: 'failed', views: '0', likes: '0', errorMessage: 'YouTube: Quota exceeded limit' },
    { id: '5', title: 'Tips for Shooting Cinematic drone Footage', description: 'Quick tips on camera settings, lighting, and movement for high quality videos.', mediaPath: '', mediaType: 'image/png', date: '2026-07-01', platforms: ['facebook'], status: 'published', views: '9.4K', likes: '340' },
    { id: '6', title: 'Packing list checklist checklist template pdf', description: 'Shared layout of packing files.', mediaPath: '', mediaType: 'image/png', date: '2026-06-28', platforms: ['facebook'], status: 'draft', views: '0', likes: '0' }
  ])

  // Filters
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(post => {
            const platforms = post.targets ? post.targets.map(t => t.platform) : []
            return {
              id: post.id.toString(),
              title: post.title || 'Untitled Post',
              description: post.description || '',
              mediaPath: post.media_path || '',
              mediaType: post.media_type || '',
              date: new Date(post.created_at).toISOString().split('T')[0],
              platforms,
              status: post.status,
              views: '0',
              likes: '0'
            }
          })
          setPosts(formatted)
        }
      })
      .catch(() => {})
  }, [])

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this post from database history?')) {
      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setPosts(posts.filter(post => post.id !== id))
        } else {
          setPosts(posts.filter(post => post.id !== id))
        }
      } catch (err) {
        setPosts(posts.filter(post => post.id !== id))
      }
    }
  }

  // Filter application helper
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPlatform = platformFilter === 'all' || post.platforms.includes(platformFilter)
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter

    return matchesSearch && matchesPlatform && matchesStatus
  })

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600 }}>Post History</h1>
        <p>Manage and audit previous publications, drafts, and channel posting errors.</p>
      </div>

      {/* Search and Filters bar */}
      <div className="glass-card" style={{ padding: '12px 16px', marginBottom: '20px' }}>
        <div className="filter-bar">
          
          <div className="filters-left">
            {/* Search inputs */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                style={{ paddingLeft: '32px', paddingTop: '8px', paddingBottom: '8px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>

            {/* Platform filter buttons */}
            <div className="filter-btn-group">
              <button 
                type="button" 
                className={`filter-opt-btn ${platformFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('all')}
              >
                All Channels
              </button>
              <button 
                type="button" 
                className={`filter-opt-btn ${platformFilter === 'facebook' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('facebook')}
              >
                Facebook
              </button>
              <button 
                type="button" 
                className={`filter-opt-btn ${platformFilter === 'youtube' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('youtube')}
              >
                YouTube
              </button>
              <button 
                type="button" 
                className={`filter-opt-btn ${platformFilter === 'tiktok' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('tiktok')}
              >
                TikTok
              </button>
            </div>

            {/* Status filter button group */}
            <div className="filter-btn-group">
              <button 
                type="button" 
                className={`filter-opt-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Status
              </button>
              <button 
                type="button" 
                className={`filter-opt-btn ${statusFilter === 'published' ? 'active' : ''}`}
                onClick={() => setStatusFilter('published')}
              >
                Published
              </button>
              <button 
                type="button" 
                className={`filter-opt-btn ${statusFilter === 'draft' ? 'active' : ''}`}
                onClick={() => setStatusFilter('draft')}
              >
                Draft
              </button>
              <button 
                type="button" 
                className={`filter-opt-btn ${statusFilter === 'failed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('failed')}
              >
                Failed
              </button>
            </div>

          </div>
          
        </div>
      </div>

      {/* Main post history table listing */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredPosts.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Post Details</th>
                  <th>Channels</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Insights</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr key={post.id}>
                    <td>
                      <div className="post-preview-cell">
                        <div className="post-preview-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                          {post.mediaType && post.mediaType.startsWith('image/') ? '🖼️' : '🎥'}
                        </div>
                        <div className="post-preview-text">
                          <h4 style={{ maxWidth: '280px' }}>{post.title}</h4>
                          <p style={{ maxWidth: '280px' }}>{post.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="badges-cell">
                        {post.platforms.includes('facebook') && <span className="badge badge-facebook"><Facebook size={10} /> FB</span>}
                        {post.platforms.includes('youtube') && <span className="badge badge-youtube"><Youtube size={10} /> YT</span>}
                        {post.platforms.includes('tiktok') && <span className="badge badge-tiktok"><TikTokIcon size={10} /> TT</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} style={{ color: 'var(--text-secondary)' }} />
                        {post.date}
                      </span>
                    </td>
                    <td>
                      <span className={`badge status-${post.status}`}>
                        {post.status}
                      </span>
                      {post.status === 'failed' && post.errorMessage && (
                        <div 
                          style={{ fontSize: '0.7rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}
                          title={post.errorMessage}
                        >
                          <AlertCircle size={10} />
                          <span>hover for details</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {post.status === 'published' ? (
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.8125rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <Eye size={12} style={{ color: 'var(--text-secondary)' }} /> {post.views}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Heart size={12} style={{ color: 'var(--text-secondary)' }} /> {post.likes}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {post.status === 'published' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '4px' }} 
                            title="Open Link"
                            onClick={() => window.open('#')}
                          >
                            <ExternalLink size={12} />
                          </button>
                        )}
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: '4px', color: '#fca5a5' }} 
                          title="Delete"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>No posts found</h3>
            <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>Try modifying your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostHistory
