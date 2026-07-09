import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Eye, Heart, UserPlus, Award, Calendar, Link2, AlertCircle } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import { Chart } from '../components/Chart'

function Analytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [hasConnectedChannels, setHasConnectedChannels] = useState(false)
  const [loading, setLoading] = useState(true)

  // Overview stats (initialized to zero)
  const [stats, setStats] = useState({
    views: '0',
    viewsChange: '',
    engagement: '0',
    engagementChange: '',
    followers: '0',
    followersChange: '',
    topPlatform: '—',
    topPlatformVal: 'No data'
  })

  // Top content list (empty initially)
  const [topContent, setTopContent] = useState([])

  // Chart datasets (clean initial state)
  const [viewsData, setViewsData] = useState({
    labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    datasets: [
      { label: 'Facebook', data: [0, 0, 0, 0, 0, 0, 0], borderColor: '#1877F2', backgroundColor: 'rgba(24, 119, 242, 0.01)', fill: true, tension: 0.4 },
      { label: 'YouTube', data: [0, 0, 0, 0, 0, 0, 0], borderColor: '#FF0000', backgroundColor: 'rgba(255, 0, 0, 0.01)', fill: true, tension: 0.4 },
      { label: 'TikTok', data: [0, 0, 0, 0, 0, 0, 0], borderColor: '#00F2EA', backgroundColor: 'rgba(0, 242, 234, 0.01)', fill: true, tension: 0.4 }
    ]
  })

  const [engagementData, setEngagementData] = useState({
    labels: ['Likes', 'Comments', 'Shares'],
    datasets: [
      { label: 'Facebook', data: [0, 0, 0], backgroundColor: '#1877F2', borderRadius: 4 },
      { label: 'YouTube', data: [0, 0, 0], backgroundColor: '#FF0000', borderRadius: 4 },
      { label: 'TikTok', data: [0, 0, 0], backgroundColor: '#00F2EA', borderRadius: 4 }
    ]
  })

  const [distributionData, setDistributionData] = useState({
    labels: ['Facebook', 'YouTube', 'TikTok'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#1877F2', '#FF0000', '#00F2EA'],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }
    ]
  })

  const [growthData, setGrowthData] = useState({
    labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    datasets: [
      {
        label: 'Total Followers',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.01)',
        fill: true,
        tension: 0.3
      }
    ]
  })

  const checkAndFetchAnalytics = async () => {
    setLoading(true)
    try {
      // Check if there are any connected accounts
      const accRes = await fetch('/api/auth/accounts')
      const accJson = await accRes.json()
      const accData = accJson.data || []
      
      const hasConnections = Array.isArray(accData) && accData.length > 0
      setHasConnectedChannels(hasConnections)

      if (hasConnections) {
        // Fetch real analytics data
        const statsRes = await fetch('/api/analytics/overview')
        const statsJson = await statsRes.json()
        const statsData = statsJson.data
        
        if (statsData) {
          setStats({
            views: statsData.totalViews ? statsData.totalViews.toLocaleString() : '0',
            viewsChange: statsData.totalViewsChange || '',
            engagement: statsData.totalEngagement ? statsData.totalEngagement.toLocaleString() : '0',
            engagementChange: statsData.totalEngagementChange || '',
            followers: statsData.followersAdded ? statsData.followersAdded.toLocaleString() : '0',
            followersChange: statsData.followersAddedChange || '',
            topPlatform: statsData.topPlatform || '—',
            topPlatformVal: statsData.topPlatformVal || 'No data'
          })

          // Update chart datasets if server provides historical datasets
          if (statsData.chartViews) {
            setViewsData(statsData.chartViews)
          }
          if (statsData.chartEngagement) {
            setEngagementData(statsData.chartEngagement)
          }
          if (statsData.chartDistribution) {
            setDistributionData(statsData.chartDistribution)
          }
          if (statsData.chartGrowth) {
            setGrowthData(statsData.chartGrowth)
          }
          if (Array.isArray(statsData.topContent)) {
            setTopContent(statsData.topContent)
          }
        }
      }
    } catch (err) {
      console.log('Query analytics endpoint failed (running in offline mode).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAndFetchAnalytics()
  }, [timeRange])

  return (
    <div>
      <div className="filter-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 600 }}>Analytics</h1>
          <p>Multi-platform audience engagement, views, and content insights.</p>
        </div>

        <div className="filters-right">
          <div className="filter-btn-group">
            <button 
              type="button" 
              className={`filter-opt-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
              disabled={!hasConnectedChannels}
            >
              7d
            </button>
            <button 
              type="button" 
              className={`filter-opt-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
              disabled={!hasConnectedChannels}
            >
              30d
            </button>
            <button 
              type="button" 
              className={`filter-opt-btn ${timeRange === '90d' ? 'active' : ''}`}
              onClick={() => setTimeRange('90d')}
              disabled={!hasConnectedChannels}
            >
              90d
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }} disabled={!hasConnectedChannels}>
            <Calendar size={14} />
            <span>Select Range</span>
          </button>
        </div>
      </div>

      {!hasConnectedChannels ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={36} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No channels connected</h3>
          <p style={{ fontSize: '0.8125rem', marginTop: '6px', maxWidth: '400px', lineHeight: 1.5, marginBottom: '20px' }}>
            To see analytics, page insights, and view trend stats, please link your Facebook Page, YouTube Channel, or TikTok Account.
          </p>
          <Link to="/accounts" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
            <Link2 size={12} />
            <span>Connect Channels</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <StatsCard 
              title="Total Views" 
              value={stats.views} 
              change={stats.viewsChange} 
              changeType="up" 
              icon={Eye} 
            />
            <StatsCard 
              title="Total Interactions" 
              value={stats.engagement} 
              change={stats.engagementChange} 
              changeType="up" 
              icon={Heart} 
            />
            <StatsCard 
              title="Follower Growth" 
              value={stats.followers} 
              change={stats.followersChange} 
              changeType="up" 
              icon={UserPlus} 
            />
            <StatsCard 
              title="Top Performing Channel" 
              value={stats.topPlatform} 
              change={stats.topPlatformVal} 
              changeType="up" 
              icon={Award} 
            />
          </div>

          {/* Charts Grid */}
          <div className="charts-grid-2x2">
            <Chart 
              type="line" 
              data={viewsData} 
              title="Views Trend Over Time" 
              subtitle="View rates across connected platforms" 
            />
            
            <Chart 
              type="bar" 
              data={engagementData} 
              title="Engagement Breakdown" 
              subtitle="Aggregate comparison of likes, comments, and shares"
              options={{
                scales: {
                  x: { stacked: false },
                  y: { stacked: false }
                }
              }}
            />

            <Chart 
              type="doughnut" 
              data={distributionData} 
              title="Share of Voice / Views" 
              subtitle="Distribution percentage of viewer count per channel" 
            />

            <Chart 
              type="line" 
              data={growthData} 
              title="Subscriber Growth Trend" 
              subtitle="Unified viewer growth progression mapping" 
            />
          </div>

          {/* Top Performing content Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Top Performing Content</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sorted by Views</span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Platform</th>
                    <th>Views</th>
                    <th>Engagement Rate</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topContent.length > 0 ? (
                    topContent.map(content => (
                      <tr key={content.id}>
                        <td style={{ fontWeight: 500, color: '#ffffff' }}>{content.title}</td>
                        <td>
                          {content.platform === 'facebook' && <span className="badge badge-facebook">Facebook</span>}
                          {content.platform === 'youtube' && <span className="badge badge-youtube">YouTube</span>}
                          {content.platform === 'tiktok' && <span className="badge badge-tiktok">TikTok</span>}
                        </td>
                        <td style={{ fontWeight: 600 }}>{content.views}</td>
                        <td>{content.engagement}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{content.likes}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{content.comments}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{content.date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No published content records found to analyze.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

export default Analytics
