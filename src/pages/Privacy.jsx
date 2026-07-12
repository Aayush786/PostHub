import React from 'react'
import { Shield, Lock, Eye, Trash2, Globe } from 'lucide-react'

function Privacy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={28} style={{ color: 'var(--primary-color)' }} />
          <span>Privacy Policy</span>
        </h1>
        <p style={{ marginTop: '6px' }}>Last Updated: July 12, 2026. This privacy policy describes how PostHub handles and protects your social media account data.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Overview */}
        <section className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
            <span>1. Overview & Data Storage</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem' }}>
            PostHub is a self-hosted social media management tool designed to publish and schedule posts to Facebook Pages, YouTube Channels, and TikTok Accounts simultaneously. All user data, including API access tokens, channel statistics, and drafts, are stored locally within your secure SQLite database instance. No personal data is transmitted, processed, or stored on third-party servers.
          </p>
        </section>

        {/* Data We Collect */}
        <section className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} style={{ color: 'var(--text-secondary)' }} />
            <span>2. Data We Collect and Access</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '12px' }}>
            When you connect a social media account through our secure OAuth authentication flow, we retrieve and access the following information:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Meta (Facebook Pages):</strong> Long-lived Page access tokens, Page name, Page ID, page follower count, and post metrics.</li>
            <li><strong>Google (YouTube Channels):</strong> OAuth tokens, channel name, channel ID, subscriber count, video metrics, and video upload endpoints.</li>
            <li><strong>TikTok:</strong> OAuth tokens, account display name, username, open_id, and video publishing statuses.</li>
          </ul>
        </section>

        {/* How We Use Your Data */}
        <section className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: 'var(--text-secondary)' }} />
            <span>3. How We Use the Data</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '12px' }}>
            We only use the retrieved credentials and API scopes to perform actions that you explicitly authorize inside the app:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Uploading, publishing, and scheduling text, photo, and video posts to your connected channels.</li>
            <li>Reading Page, Video, and Channel insights to display your performance metrics inside the Analytics Dashboard.</li>
            <li>We do **not** sell, share, rent, or distribute any user data, credentials, or API tokens with third parties under any circumstances.</li>
          </ul>
        </section>

        {/* Data Deletion & Revocation */}
        <section className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} style={{ color: 'var(--text-secondary)' }} />
            <span>4. User Data Deletion Instructions</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '12px' }}>
            You have absolute control over your connected accounts and API data. You can delete your data in any of the following ways:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Disconnecting inside PostHub:</strong> Go to the **Connected Channels** tab and click the **"Disconnect"** button. This immediately and permanently deletes the account's access token, refresh token, and metadata from your SQLite database.</li>
            <li><strong>Revoking from Platform Settings:</strong> You can revoke PostHub's API access at any time directly through the platform developer consoles:
              <ul style={{ paddingLeft: '20px', marginTop: '4px', listStyleType: 'circle' }}>
                <li>Facebook: App settings under your Facebook account security configurations.</li>
                <li>Google/YouTube: [Google Account Security Permissions](https://myaccount.google.com/permissions).</li>
                <li>TikTok: Account Settings & Privacy &gt; Security and Login &gt; Manage App Permissions.</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Compliance */}
        <section className="glass-card" style={{ padding: '24px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px' }}>5. Contact & Support</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem' }}>
            For privacy inquiries, technical support, or complete data deletion requests, you can contact the developer directly or inspect the source code on our open repository.
          </p>
        </section>

      </div>
    </div>
  )
}

export default Privacy
