import React from 'react'
import '../styles/sidebar.css'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
  badge?: string
  disabled?: boolean
}

interface SidebarSection {
  title: string
  items: QuickAction[]
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {

  const quickActions: QuickAction[] = [
    {
      id: 'new-trade',
      label: 'New Trade',
      icon: '➕',
      action: () => console.log('New trade')
    },
    {
      id: 'market-scan',
      label: 'Market Scan',
      icon: '🔍',
      action: () => console.log('Market scan'),
      badge: 'Live'
    },
    {
      id: 'alerts',
      label: 'Price Alerts',
      icon: '🔔',
      action: () => console.log('Alerts'),
      badge: '3'
    },
    {
      id: 'positions',
      label: 'Positions',
      icon: '📊',
      action: () => console.log('Positions')
    }
  ]

  const sections: SidebarSection[] = [
    {
      title: 'Trading',
      items: [
        {
          id: 'watchlist',
          label: 'Watchlist',
          icon: '👁️',
          action: () => console.log('Watchlist')
        },
        {
          id: 'orderbook',
          label: 'Orderbook',
          icon: '📖',
          action: () => console.log('Orderbook')
        },
        {
          id: 'trades-history',
          label: 'Trade History',
          icon: '📜',
          action: () => console.log('Trade history')
        }
      ]
    },
    {
      title: 'Analysis',
      items: [
        {
          id: 'technical-analysis',
          label: 'Technical Analysis',
          icon: '📈',
          action: () => console.log('Technical analysis')
        },
        {
          id: 'sentiment',
          label: 'Market Sentiment',
          icon: '🎭',
          action: () => console.log('Sentiment')
        },
        {
          id: 'backtesting',
          label: 'Backtesting',
          icon: '⏪',
          action: () => console.log('Backtesting')
        }
      ]
    },
    {
      title: 'Tools',
      items: [
        {
          id: 'calculator',
          label: 'Risk Calculator',
          icon: '🧮',
          action: () => console.log('Calculator')
        },
        {
          id: 'calendar',
          label: 'Economic Calendar',
          icon: '📅',
          action: () => console.log('Calendar')
        },
        {
          id: 'news',
          label: 'Market News',
          icon: '📰',
          action: () => console.log('News'),
          badge: 'New'
        }
      ]
    }
  ]

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          {!isCollapsed && <span className="logo-text">Traders Mastery</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          {isCollapsed ? '▶️' : '◀️'}
        </button>
      </div>

      <div className="sidebar-content">
        <div className="quick-actions">
          {!isCollapsed && <h3>Quick Actions</h3>}
          <div className="action-buttons">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={`action-button ${action.disabled ? 'disabled' : ''}`}
                onClick={action.action}
                disabled={action.disabled}
                title={isCollapsed ? action.label : undefined}
              >
                <span className="action-icon">{action.icon}</span>
                {!isCollapsed && <span className="action-label">{action.label}</span>}
                {action.badge && (
                  <span className="action-badge">{action.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-sections">
          {sections.map((section) => (
            <div key={section.title} className="sidebar-section">
              {!isCollapsed && (
                <h4 className="section-title">{section.title}</h4>
              )}
              <div className="section-items">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className="section-item"
                    onClick={item.action}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="item-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="item-label">{item.label}</span>
                    )}
                    {item.badge && (
                      <span className="item-badge">{item.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-icon online">🟢</span>
            {!isCollapsed && <span className="status-text">Market Open</span>}
          </div>
          <div className="status-item">
            <span className="status-icon">📡</span>
            {!isCollapsed && <span className="status-text">Connected</span>}
          </div>
        </div>
      </div>
    </div>
  )
}