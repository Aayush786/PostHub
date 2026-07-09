import React from 'react'
import { Facebook, Youtube } from 'lucide-react'

const TikTokIcon = ({ size = 18, color = 'currentColor' }) => (
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

function PlatformToggle({ selected = [], onChange }) {
  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, activeClass: 'active-facebook' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, activeClass: 'active-youtube' },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, activeClass: 'active-tiktok' }
  ]

  const handleToggle = (platformId) => {
    if (selected.includes(platformId)) {
      onChange(selected.filter(item => item !== platformId))
    } else {
      onChange([...selected, platformId])
    }
  }

  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
        Select Platforms to Publish
      </span>
      <div className="platform-toggle-container">
        {platforms.map((platform) => {
          const Icon = platform.icon
          const isActive = selected.includes(platform.id)
          const chipClass = `platform-toggle-chip ${isActive ? platform.activeClass : ''}`
          
          return (
            <button
              key={platform.id}
              type="button"
              className={chipClass}
              onClick={() => handleToggle(platform.id)}
            >
              <Icon size={18} />
              <span>{platform.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PlatformToggle
