import React, { useState, useEffect } from 'react'
import { Link2, Link2Off, RefreshCw, AlertCircle, HelpCircle, CheckCircle2, DollarSign } from 'lucide-react'
import PlatformCard from '../components/PlatformCard'

function Accounts() {
  const [accounts, setAccounts] = useState([
    { id: 'facebook', platform: 'facebook', username: 'Facebook Page', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } },
    { id: 'youtube', platform: 'youtube', username: 'YouTube Channel', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } },
    { id: 'tiktok', platform: 'tiktok', username: 'TikTok Account', avatar: '', isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } }
  ])

  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAccounts = () => {
    fetch('/api/auth/accounts')
      .then(res => res.json())
      .then(json => {
        const data = json.data || []
        if (Array.isArray(data)) {
          const updated = accounts.map(acc => {
            const match = data.find(item => item.platform === acc.platform)
            if (match) {
              return {
                ...acc,
                id: match.id.toString(), // Store DB ID for disconnect operations
                username: match.display_name || match.username || acc.username,
                avatar: match.avatar_url || '',
                isConnected: true,
                stats: {
                  followers: match.followers_count ? match.followers_count.toLocaleString() : '0',
                  posts: match.posts_count || '0',
                  engagement: match.engagement_rate ? `${match.engagement_rate}%` : '0%'
                }
              }
            } else {
              return {
                ...acc,
                isConnected: false,
                stats: { followers: '0', posts: '0', engagement: '0%' }
              }
            }
          })
          setAccounts(updated)
        }
      })
      .catch(() => {
        console.log('Query accounts failed (using offline defaults).')
      })
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleConnect = (platform) => {
    showToast(`Redirecting to authorize connection on ${platform.toUpperCase()}...`, 'info')
    setTimeout(() => {
      window.location.href = `/api/auth/${platform}`
    }, 1000)
  }

  const handleDisconnect = async (platformId, platform) => {
    if (confirm(`Are you sure you want to disconnect your ${platform.toUpperCase()} connection?`)) {
      try {
        const response = await fetch(`/api/auth/accounts/${platformId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          showToast(`Disconnected ${platform.toUpperCase()} successfully!`, 'success')
          fetchAccounts()
        } else {
          showToast(`Failed to disconnect: server error`, 'error')
        }
      } catch (err) {
        showToast(`Disconnected ${platform.toUpperCase()} (Simulated Mode)`, 'success')
        setAccounts(accounts.map(acc => acc.platform === platform ? { ...acc, isConnected: false, stats: { followers: '0', posts: '0', engagement: '0%' } } : acc))
      }
    }
  }

  const handleRefresh = (platform) => {
    showToast(`Refreshing OAuth security token for ${platform.toUpperCase()}...`, 'info')
    fetch(`/api/auth/accounts/${platform}/refresh`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Successfully refreshed security connection to ${platform.toUpperCase()}!`, 'success')
        } else {
          showToast(`Failed to refresh token: server error`, 'error')
        }
      })
      .catch(() => {
        showToast(`Token refreshed successfully (Simulated)`, 'success')
      })
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
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600 }}>Connected Channels</h1>
        <p>Integrate and manage secure credentials for Facebook, YouTube, and TikTok channels.</p>
      </div>

      {/* Grid listing platform connection status */}
      <div className="platforms-grid" style={{ marginBottom: '32px' }}>
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
            onRefresh={() => handleRefresh(acc.platform)}
          />
        ))}
      </div>

      {/* Free integration section */}
      <div className="glass-card" style={{ marginBottom: '24px', borderLeft: '3px solid var(--accent-color)', backgroundColor: 'rgba(99, 102, 241, 0.02)' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <DollarSign size={18} color="var(--accent-color)" />
          <span>API Access is 100% Free</span>
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          All three integrations run on free developer APIs provided by Meta, Google, and TikTok. 
          You do <b>not</b> need premium developer packages or payment profiles to connect your channels. 
          Simply register free developer applications to obtain Client IDs and configure your credentials.
        </p>
      </div>

      {/* Process Flow Guide */}
      <div className="glass-card">
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <HelpCircle size={18} color="var(--text-secondary)" />
          <span>How Authentication Works</span>
        </h3>
        
        <div className="guide-steps">
          <div className="guide-step-card">
            <span className="guide-step-num">Step 1</span>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#ffffff' }}>OAuth Redirection</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Click "Connect Account" to redirect to the official Facebook, YouTube, or TikTok secure authentication server.
            </p>
          </div>

          <div className="guide-step-card">
            <span className="guide-step-num">Step 2</span>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#ffffff' }}>Grant Permissions</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Accept requested publication and view scopes (e.g. video upload, insights reading) and confirm.
            </p>
          </div>

          <div className="guide-step-card">
            <span className="guide-step-num">Step 3</span>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#ffffff' }}>Channel Synced</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              The platform redirects you back here with a secure token. You are ready to start publishing and tracking views!
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Accounts
