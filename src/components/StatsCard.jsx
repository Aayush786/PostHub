import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function StatsCard({ title, value, change, changeType, icon: Icon, color = 'purple', subtitle }) {
  return (
    <div className="glass-card stats-card">
      <div>
        <div className="stats-card-header">
          <span className="stats-card-title">{title}</span>
          {Icon && (
            <div className="stats-card-icon">
              <Icon size={16} />
            </div>
          )}
        </div>
        <div className="stats-card-value">{value}</div>
      </div>
      
      <div className="stats-card-footer">
        {change && (
          <span className={changeType === 'up' ? 'trend-up' : 'trend-down'} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            {changeType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </span>
        )}
        <span className="stats-card-subtitle">{subtitle || 'vs last month'}</span>
      </div>
    </div>
  )
}

export default StatsCard
