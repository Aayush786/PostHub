import React, { useState, useEffect } from 'react'
import { BarChart3, Eye, Heart, UserPlus, Award, Calendar } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import { Chart } from '../components/Chart'

function Analytics() {
  const [timeRange, setTimeRange] = useState('30d')

  // Overview stats
  const [stats, setStats] = useState({
    views: '840,240',
    viewsChange: '+18.2%',
    engagement: '40,329',
    engagementChange: '+12.4%',
    followers: '+8,410',
    followersChange: '+5.6%',
    topPlatform: 'YouTube',
    topPlatformVal: '58.2% share'
  })

  // Chart data definition helpers
  const viewsData = {
    labels: ['June 10', 'June 15', 'June 20', 'June 25', 'June 30', 'July 5', 'July 9'],
    datasets: [
      {
        label: 'Facebook',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 34000],
        borderColor: '#1877F2',
        backgroundColor: 'rgba(24, 119, 242, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'YouTube',
        data: [25000, 32000, 28000, 42000, 48000, 52000, 58000],
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'TikTok',
        data: [42000, 55000, 68000, 52000, 72000, 89000, 94000],
        borderColor: '#00F2EA',
        backgroundColor: 'rgba(0, 242, 234, 0.05)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const engagementData = {
    labels: ['Likes', 'Comments', 'Shares'],
    datasets: [
      {
        label: 'Facebook',
        data: [3200, 840, 1200],
        backgroundColor: '#1877F2',
        borderRadius: 6
      },
      {
        label: 'YouTube',
        data: [8400, 2100, 940],
        backgroundColor: '#FF0000',
        borderRadius: 6
      },
      {
        label: 'TikTok',
        data: [18200, 4500, 2300],
        backgroundColor: '#00F2EA',
        borderRadius: 6
      }
    ]
  }

  const distributionData = {
    labels: ['Facebook', 'YouTube', 'TikTok'],
    datasets: [
      {
        data: [18.2, 45.4, 36.4],
        backgroundColor: ['#1877F2', '#FF0000', '#00F2EA'],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }
    ]
  }

  const growthData = {
    labels: ['June 10', 'June 15', 'June 20', 'June 25', 'June 30', 'July 5', 'July 9'],
    datasets: [
      {
        label: 'Total Followers',
        data: [116100, 117800, 119200, 121000, 122100, 123400, 124500],
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  }

  // Top content list
  const [topContent, setTopContent] = useState([
    { id: '1', title: 'Top 10 Hidden Gems in Switzerland 🇨🇭', platform: 'youtube', views: '124.5K', engagement: '8.4%', likes: '6.2K', comments: '1.2K', date: '2026-07-08' },
    { id: '2', title: 'How to Pack Light for 2 Weeks in Asia', platform: 'tiktok', views: '98.2K', engagement: '9.2%', likes: '8.4K', comments: '640', date: '2026-07-06' },
    { id: '3', title: 'Sunset Views over Venice Canals 🛶', platform: 'facebook', views: '45.1K', engagement: '5.1%', likes: '2.1K', comments: '220', date: '2026-07-07' },
    { id: '4', title: 'Ultimate Minimalist Travel Bag Setup', platform: 'youtube', views: '38.4K', engagement: '6.8%', likes: '2.4K', comments: '380', date: '2026-07-05' },
    { id: '5', title: 'Venice Pizza Testing vlog: Italy series', platform: 'tiktok', views: '28.1K', engagement: '10.4%', likes: '3.1K', comments: '120', date: '2026-07-04' }
  ])

  useEffect(() => {
    // Attempt cache fetch
    fetch('/api/analytics/overview')
      .then(res => res.json())
      .then(data => {
        // Cache mapping if available
        if (data && data.totalViews) {
          setStats({
            views: data.totalViews,
            viewsChange: data.totalViewsChange || '+18.2%',
            engagement: data.totalEngagement || '40,329',
            engagementChange: data.totalEngagementChange || '+12.4%',
            followers: data.followersAdded || '+8,410',
            followersChange: data.followersAddedChange || '+5.6%',
            topPlatform: data.topPlatform || 'YouTube',
            topPlatformVal: data.topPlatformVal || '58.2% share'
          })
        }
      })
      .catch(err => console.log('Mocking analytics overview statistics...'))
  }, [timeRange])

  return (
    <div>
      <div className="filter-bar">
        <div>
          <h1 className="gradient-text">Analytics & Insights</h1>
          <p>Multi-platform audience engagement, content retention rates, and insights.</p>
        </div>

        <div className="filters-right">
          <div className="filter-btn-group">
            <button 
              type="button" 
              className={`filter-opt-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button 
              type="button" 
              className={`filter-opt-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button 
              type="button" 
              className={`filter-opt-btn ${timeRange === '90d' ? 'active' : ''}`}
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
            <Calendar size={16} />
            <span>Select Date</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatsCard 
          title="Total Views" 
          value={stats.views} 
          change={stats.viewsChange} 
          changeType="up" 
          icon={Eye} 
          color="blue" 
        />
        <StatsCard 
          title="Total Interactions" 
          value={stats.engagement} 
          change={stats.engagementChange} 
          changeType="up" 
          icon={Heart} 
          color="pink" 
        />
        <StatsCard 
          title="Follower Growth" 
          value={stats.followers} 
          change={stats.followersChange} 
          changeType="up" 
          icon={UserPlus} 
          color="purple" 
        />
        <StatsCard 
          title="Top Performing Channel" 
          value={stats.topPlatform} 
          change={stats.topPlatformVal} 
          changeType="up" 
          icon={Award} 
          color="cyan" 
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Top Performing Content</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sorted by Views</span>
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
              {topContent.map(content => (
                <tr key={content.id}>
                  <td style={{ fontWeight: 600 }}>{content.title}</td>
                  <td>
                    {content.platform === 'facebook' && <span className="badge badge-facebook">Facebook</span>}
                    {content.platform === 'youtube' && <span className="badge badge-youtube">YouTube</span>}
                    {content.platform === 'tiktok' && <span className="badge badge-tiktok">TikTok</span>}
                  </td>
                  <td style={{ fontWeight: 700 }}>{content.views}</td>
                  <td>{content.engagement}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{content.likes}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{content.comments}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{content.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default Analytics
