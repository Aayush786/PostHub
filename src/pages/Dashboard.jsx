import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Users, Eye, Heart, FileText, Calendar, Facebook, Youtube, Plus, AlertCircle } from 'lucide-react'
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
    totalFollowers: '0',
    totalFollowersChange: '',
    totalViews: '0',
    totalViewsChange: '',
    engagementRate: '0%',
    engagementRateChange: '',
    postsCount: '0',
    postsCountChange: ''
  })

  const [accounts, setAccounts] = useState([
    { id: 'facebook', platform: 'facebook', username: 'Facebook Page', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } },
    { id: 'youtube', platform: 'youtube', username: 'YouTube Channel', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } },
    { id: 'tiktok', platform: 'tiktok', username: 'TikTok Account', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } }
  ])

  const [recentPosts, setRecentPosts] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch connected channels
      const accRes = await fetch('/api/auth/accounts')
      const accJson = await accRes.json()
      const accData = accJson.data || []
      
      let connectedPlatformsCount = 0
      const updatedAccounts = accounts.map(acc => {
        const dbAcc = Array.isArray(accData) ? accData.find(da => da.platform === acc.platform) : null
        if (dbAcc) {
          connectedPlatformsCount++
          return {
            ...acc,
            username: dbAcc.display_name || dbAcc.username || acc.username,
            avatar: dbAcc.avatar_url || '',
            isConnected: true,
            stats: {
              followers: dbAcc.followers_count ? dbAcc.followers_count.toLocaleString() : '0',
              posts: dbAcc.posts_count || '0',
              engagement: dbAcc.engagement_rate ? `${dbAcc.engagement_rate}%` : '0%'
            }
          }
        }
        return acc
      })
      setAccounts(updatedAccounts)

      // 2. Fetch recent posts
      const postsRes = await fetch('/api/posts')
      const postsJson = await postsRes.json()
      const postsData = postsJson.data || []
      if (Array.isArray(postsData)) {
        const formatted = postsData.slice(0, 5).map(post => {
          const platforms = post.targets ? post.targets.map(t => t.platform) : []
          return {
            id: post.id.toString(),
            title: post.title || 'Untitled Publication',
            description: post.description || '',
            date: new Date(post.created_at).toISOString().split('T')[0],
            platforms,
            status: post.status,
            views: '0',
            likes: '0'
          }
        })
        setRecentPosts(formatted)

        // Build recent activities
        const list = []
        postsData.slice(0, 4).forEach((post, i) => {
          const platforms = post.targets ? post.targets.map(t => t.platform) : []
          platforms.forEach(plat => {
            list.push({
              id: `${post.id}-${plat}-${i}`,
              platform: plat,
              title: post.title || 'Draft',
              status: post.status,
              time: new Date(post.created_at).toLocaleDateString()
            })
          })
        })
        setActivities(list)
      }

      // 3. Fetch summary stats
      const statsRes = await fetch('/api/analytics/overview')
      const statsJson = await statsRes.json()
      const statsData = statsJson.data
      if (statsData && statsData.totalAccounts !== undefined) {
        setStats({
          totalFollowers: statsData.totalFollowers ? statsData.totalFollowers.toLocaleString() : '0',
          totalFollowersChange: statsData.totalFollowersChange || '',
          totalViews: statsData.totalViews ? statsData.totalViews.toLocaleString() : '0',
          totalViewsChange: statsData.totalViewsChange || '',
          engagementRate: statsData.engagementRate ? `${statsData.engagementRate}%` : '0%',
          engagementRateChange: statsData.engagementRateChange || '',
          postsCount: statsData.totalPosts || '0',
          postsCountChange: statsData.postsCountChange || ''
        })
      }
    } catch (err) {
      console.log('API queries failed (offline or credentials missing). Using zero-state defaults.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleConnect = (platform) => {
    window.location.href = `/api/auth/${platform}`
  }

  const handleDisconnect = async (id, platform) => {
    if (confirm(`Are you sure you want to disconnect your ${platform.toUpperCase()} connection?`)) {
      try {
        await fetch(`/api/auth/accounts/${id}`, { method: 'DELETE' })
        fetchDashboardData()
      } catch (err) {
        setAccounts(accounts.map(acc => acc.id === id ? { ...acc, isConnected: false } : acc))
      }
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
            key={acc.platform}
            platform={acc.platform}
            username={acc.username}
            avatar={acc.avatar}
            isConnected={acc.isConnected}
            stats={acc.stats}
            onConnect={() => handleConnect(acc.platform)}
            onDisconnect={() => handleDisconnect(acc.id, acc.platform)}
          />
        ))}
      </div>

      {/* Split Recent Posts & Activity */}
      <div className="dashboard-layout-split" style={{ marginTop: '8px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Publications</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> Last 7 Days
            </span>
          </div>

          {recentPosts.length > 0 ? (
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
                        <span className={`badge status-${post.status}`}>
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: '10px' }}>
              <AlertCircle size={24} />
              <p style={{ fontSize: '0.8125rem' }}>No recent publications found.</p>
              <Link to="/compose" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '4px' }}>
                <Plus size={12} />
                <span>Create New Post</span>
              </Link>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '18px' }}>Activity Log</h3>
          
          {activities.length > 0 ? (
            <div className="activity-feed">
              {activities.map((act) => (
                <div className="activity-item" key={act.id}>
                  <div className={`activity-dot activity-dot-${act.platform}`}>
                    {act.platform === 'facebook' && <Facebook size={10} />}
                    {act.platform === 'youtube' && <Youtube size={10} />}
                    {act.platform === 'tiktok' && <TikTokIcon size={10} />}
                  </div>
                  <div className="activity-content">
                    <p style={{ fontSize: '0.8125rem' }}>
                      Publication {act.status === 'published' ? 'succeeded' : 'failed'} on {act.platform}: <b>{act.title}</b>
                    </p>
                    <span className="activity-time">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.8125rem' }}>No recent activity recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
