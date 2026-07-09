import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Eye, Heart, FileText, Calendar, ArrowUpRight, Facebook, Youtube } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import PlatformCard from '../components/PlatformCard'

const TikTokIcon = ({ size = 16, color = 'currentColor' }) => (
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

function Dashboard() {
  const [stats, setStats] = useState({
    totalFollowers: '124,520',
    totalFollowersChange: '+12.4%',
    totalViews: '840,240',
    totalViewsChange: '+18.2%',
    engagementRate: '4.8%',
    engagementRateChange: '+0.5%',
    postsCount: '36',
    postsCountChange: '+4'
  })

  const [accounts, setAccounts] = useState([
    { id: '1', platform: 'facebook', username: 'TravelDiaries Page', avatar: '', isConnected: true, stats: { followers: '45.2K', posts: '182', engagement: '3.6%' } },
    { id: '2', platform: 'youtube', username: 'TravelDiaries YT', avatar: '', isConnected: true, stats: { followers: '68.1K', posts: '94', engagement: '5.2%' } },
    { id: '3', platform: 'tiktok', username: 'travel_diaries', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } }
  ])

  const [recentPosts, setRecentPosts] = useState([
    { id: '1', title: 'Top 10 Hidden Gems in Switzerland 🇨🇭', description: 'Exploring the beauty of the Alps, hidden valleys, and crystal lakes.', date: '2026-07-08', platforms: ['facebook', 'youtube'], status: 'published', views: '28.4K', likes: '1.2K' },
    { id: '2', title: 'How to Pack Light for 2 Weeks in Asia', description: 'My ultimate minimalist packing guide for summer travels.', date: '2026-07-06', platforms: ['facebook', 'tiktok'], status: 'published', views: '45.1K', likes: '3.8K' },
    { id: '3', title: 'A Day in Venice: Vlog and Best Pizza Spots 🍕', description: 'Exploring canals, alleyways, and testing local street food.', date: '2026-07-04', platforms: ['youtube'], status: 'published', views: '12.8K', likes: '820' },
    { id: '4', title: 'Unboxing the Ultimate Travel Drone (4K)', description: 'First flight tests, specs review, and cinematic clips.', date: '2026-07-02', platforms: ['facebook', 'youtube', 'tiktok'], status: 'failed', views: '0', likes: '0' }
  ])

  useEffect(() => {
    fetch('/api/auth/accounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const updatedAccounts = accounts.map(acc => {
            const dbAcc = data.find(da => da.platform === acc.platform)
            if (dbAcc) {
              return {
                ...acc,
                username: dbAcc.display_name || dbAcc.username,
                avatar: dbAcc.avatar_url,
                isConnected: true
              }
            }
            return acc
          })
          setAccounts(updatedAccounts)
        }
      })
      .catch(() => {})

    fetch('/api/analytics/overview')
      .then(res => res.json())
      .then(data => {
        if (data && data.totalFollowers) {
          setStats({
            totalFollowers: data.totalFollowers,
            totalFollowersChange: data.totalFollowersChange,
            totalViews: data.totalViews,
            totalViewsChange: data.totalViewsChange,
            engagementRate: data.engagementRate,
            engagementRateChange: data.engagementRateChange,
            postsCount: data.postsCount,
            postsCountChange: data.postsCountChange
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleConnect = (platform) => {
    window.location.href = `/api/auth/${platform}`
  }

  const handleDisconnect = (id) => {
    if (confirm('Are you sure you want to disconnect this platform connection?')) {
      setAccounts(accounts.map(acc => acc.id === id ? { ...acc, isConnected: false } : acc))
    }
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600 }}>Dashboard</h1>
        <p>Unified oversight of your connected Facebook, YouTube, and TikTok channels.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <StatsCard 
          title="Total Followers" 
          value={stats.totalFollowers} 
          change={stats.totalFollowersChange} 
          changeType="up" 
          icon={Users} 
        />
        <StatsCard 
          title="Total Views" 
          value={stats.totalViews} 
          change={stats.totalViewsChange} 
          changeType="up" 
          icon={Eye} 
        />
        <StatsCard 
          title="Engagement Rate" 
          value={stats.engagementRate} 
          change={stats.engagementRateChange} 
          changeType="up" 
          icon={Heart} 
        />
        <StatsCard 
          title="Posts Published" 
          value={stats.postsCount} 
          change={stats.postsCountChange} 
          changeType="up" 
          icon={FileText} 
        />
      </div>

      {/* Platforms Grid Row */}
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
        Connected Channels
      </h2>
      <div className="platforms-grid">
        {accounts.map(acc => (
          <PlatformCard 
            key={acc.id}
            platform={acc.platform}
            username={acc.username}
            avatar={acc.avatar}
            isConnected={acc.isConnected}
            stats={acc.stats}
            onConnect={() => handleConnect(acc.platform)}
            onDisconnect={() => handleDisconnect(acc.id)}
          />
        ))}
      </div>

      {/* Split Recent Posts & Activity */}
      <div className="dashboard-layout-split" style={{ marginTop: '8px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Publications</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> Last 7 Days
            </span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Channels</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Likes</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="post-preview-cell">
                        <div className="post-preview-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          📝
                        </div>
                        <div className="post-preview-text">
                          <h4>{post.title}</h4>
                          <p>{post.description}</p>
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
                    <td>
                      <span className={`badge ${post.status === 'published' ? 'status-published' : 'status-failed'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{post.views}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{post.likes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '18px' }}>Activity Log</h3>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-dot activity-dot-youtube">
                <Youtube size={10} />
              </div>
              <div className="activity-content">
                <p style={{ fontSize: '0.8125rem' }}>Video upload complete: <b>Top 10 Hidden Gems in Switzerland</b></p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot activity-dot-facebook">
                <Facebook size={10} />
              </div>
              <div className="activity-content">
                <p style={{ fontSize: '0.8125rem' }}>Post published: <b>Top 10 Hidden Gems in Switzerland</b></p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot activity-dot-tiktok">
                <TikTokIcon size={10} />
              </div>
              <div className="activity-content">
                <p style={{ fontSize: '0.8125rem' }}>Post creation failed on TikTok: <b>Unboxing the Ultimate Drone</b></p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot" style={{ backgroundColor: '#52525b' }}>
                <ArrowUpRight size={10} />
              </div>
              <div className="activity-content">
                <p style={{ fontSize: '0.8125rem' }}>Connected YouTube channel: <b>TravelDiaries YT</b></p>
                <span className="activity-time">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
