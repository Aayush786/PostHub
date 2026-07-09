import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
)

export function Chart({ type, data, options, title, subtitle }) {
  
  // Set default global dark-theme options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10
          }
        }
      }
    }
  }

  // Merge default scales/styling with custom overrides if provided
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins
    },
    scales: type === 'doughnut' ? undefined : {
      x: { ...defaultOptions.scales.x, ...options?.scales?.x },
      y: { ...defaultOptions.scales.y, ...options?.scales?.y }
    }
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar data={data} options={mergedOptions} />
      case 'doughnut':
        return <Doughnut data={data} options={mergedOptions} />
      case 'line':
      default:
        return <Line data={data} options={mergedOptions} />
    }
  }

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: '16px' }}>
          {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{subtitle}</p>}
        </div>
      )}
      <div className="chart-container-inner" style={{ flex: 1, minHeight: '240px' }}>
        {renderChart()}
      </div>
    </div>
  )
}
