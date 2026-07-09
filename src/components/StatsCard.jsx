import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function StatsCard({ title, value, change, changeType, icon: Icon, color = 'purple', subtitle }) {
  // Map color string to class name
  const colorClassMap = {
    purple: 'card-purple',
    blue: 'card-blue',
    pink: 'card-pink',
    cyan: 'card-cyan'
  }

  const iconColorMap = {
    purple: '#7c3aed',
    blue: '#3b82f6',
    pink: '#ec4899',
    cyan: '#06b6d4'
  }

  const cardClass = `glass-card stats-card ${colorClassMap[color] || 'card-purple'}`

  return (
    <div className={cardClass}>
      <div>
        <div className="stats-card-header">
          <span className="stats-card-title">{title}</span>
          <div 
            className="stats-card-icon" 
            style={{ backgroundColor: `${iconColorMap[color]}15`, color: iconColorMap[color] }}
          >
            {Icon && <Icon size={20} />}
          </div>
        </div>
        <div className="stats-card-value">{value}</div>
      </div>
      
      <div className="stats-card-footer">
        {change && (
          <span className={changeType === 'up' ? 'trend-up' : 'trend-down'}>
            {changeType === 'up' ? <TrendingUp size={14} style={{ marginRight: '2px' }} /> : <TrendingDown size={14} style={{ marginRight: '2px' }} />}
            {change}
          </span>
        )}
        <span className="stats-card-subtitle">{subtitle || 'since last month'}</span>
      </div>
    </div>
  )
}

export default StatsCard
