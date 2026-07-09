import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PenSquare, BarChart3, Users, History, Layers, X } from 'lucide-react'

function Sidebar({ isOpen, setIsOpen }) {
  const [connectedCount, setConnectedCount] = useState(0)

  useEffect(() => {
    fetch('/api/auth/accounts')
      .then(res => res.json())
      .then(json => {
        const data = json.data
        if (Array.isArray(data)) {
          setConnectedCount(data.length)
        }
      })
      .catch(() => {
        setConnectedCount(0) // Default fallback
      })
  }, [])

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/compose', label: 'Compose Post', icon: PenSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/accounts', label: 'Connected Channels', icon: Users },
    { path: '/history', label: 'Post History', icon: History }
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingLeft: '4px' }}>
          <NavLink to="/" className="sidebar-logo" onClick={() => setIsOpen(false)}>
            <Layers size={18} color="#6366f1" style={{ marginRight: '2px' }} />
            <h2>PostHub</h2>
          </NavLink>
          {isOpen && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setIsOpen(false)}
              style={{ color: 'white', padding: '4px' }}
            >
              <X size={16} />
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
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="connected-indicator">
          <span>Active channels</span>
          <span className="connected-count">{connectedCount}</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
