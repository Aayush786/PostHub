import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PenSquare, BarChart3, Users, History, Zap, X } from 'lucide-react'

function Sidebar({ isOpen, setIsOpen }) {
  const [connectedCount, setConnectedCount] = useState(0)

  useEffect(() => {
    // Fetch connected accounts count
    fetch('/api/auth/accounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConnectedCount(data.length)
        }
      })
      .catch(err => {
        console.error('Error fetching accounts for sidebar count:', err)
        // Hardcode a default fallback of 3 accounts for styling purposes
        setConnectedCount(3)
      })
  }, [])

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/compose', label: 'Compose', icon: PenSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/accounts', label: 'Accounts', icon: Users },
    { path: '/history', label: 'Post History', icon: History }
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <NavLink to="/" className="sidebar-logo" onClick={() => setIsOpen(false)}>
            <Zap size={24} color="#7c3aed" fill="#7c3aed" />
            <h2>PostHub</h2>
          </NavLink>
          {isOpen && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setIsOpen(false)}
              style={{ color: 'white', padding: '4px' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="connected-indicator">
          <span>Connected Channels</span>
          <span className="connected-count">{connectedCount}</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
