import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Compose from './pages/Compose'
import Analytics from './pages/Analytics'
import Accounts from './pages/Accounts'
import PostHistory from './pages/PostHistory'
import { Menu } from 'lucide-react'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-container">
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Navigation Menu"
      >
        <Menu size={18} />
      </button>

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compose" element={<Compose />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/history" element={<PostHistory />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
