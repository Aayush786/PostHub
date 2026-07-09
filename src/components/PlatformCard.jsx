import React from 'react'
import { Facebook, Youtube, AlertCircle, Link2, Link2Off, RefreshCw } from 'lucide-react'

// Custom TikTok icon for dashboard since Lucide doesn't have a specific stylized TikTok icon
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

function PlatformCard({ 
  platform, 
  username, 
  avatar, 
  isConnected, 
  stats = { followers: '0', posts: '0', engagement: '0%' }, 
  onConnect, 
  onDisconnect,
  onRefresh
}) {
  
  // Custom definitions based on platform type
  const platformInfo = {
    facebook: {
      name: 'Facebook Page',
      color: 'fb-card',
      icon: Facebook,
      brandColor: '#1877F2',
      defaultAvatarText: 'F'
    },
    youtube: {
      name: 'YouTube Channel',
      color: 'yt-card',
      icon: Youtube,
      brandColor: '#FF0000',
      defaultAvatarText: 'Y'
    },
    tiktok: {
      name: 'TikTok Account',
      color: 'tt-card',
      icon: TikTokIcon,
      brandColor: '#00F2EA',
      defaultAvatarText: 'T'
    }
  }

  const current = platformInfo[platform] || platformInfo.facebook
  const PlatformIcon = current.icon

  return (
    <div className={`glass-card platform-card ${current.color}`}>
      <div>
        <div className="platform-card-header">
          <div className="platform-info">
            {isConnected && avatar ? (
              <img src={avatar} alt={username} className="platform-avatar" />
            ) : (
              <div className="platform-avatar-fallback">
                {current.defaultAvatarText}
              </div>
            )}
            <div className="platform-meta">
              <h3>{isConnected ? username : current.name}</h3>
              <p>{isConnected ? 'Connected' : 'Not Connected'}</p>
            </div>
          </div>
          {isConnected && <div className="status-dot-pulse" title="Account active and synced"></div>}
        </div>

        {isConnected ? (
          <div className="platform-stats-row">
            <div className="platform-stat-item">
              <span className="platform-stat-val">{stats.followers}</span>
              <span className="platform-stat-lbl">Followers</span>
            </div>
            <div className="platform-stat-item">
              <span className="platform-stat-val">{stats.posts}</span>
              <span className="platform-stat-lbl">Posts</span>
            </div>
            <div className="platform-stat-item">
              <span className="platform-stat-val">{stats.engagement}</span>
              <span className="platform-stat-lbl">Eng. Rate</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0', padding: '12px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>Connect channel to schedule, publish content, and view insights.</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {isConnected ? (
          <>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onDisconnect}
              style={{ flex: 1 }}
            >
              <Link2Off size={14} />
              <span>Disconnect</span>
            </button>
            {onRefresh && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={onRefresh}
                style={{ padding: '8px' }}
                title="Refresh OAuth Connection"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </>
        ) : (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onConnect}
            style={{ flex: 1, background: current.brandColor, boxShadow: `0 4px 12px ${current.brandColor}30` }}
          >
            <Link2 size={14} />
            <span>Connect Account</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default PlatformCard
