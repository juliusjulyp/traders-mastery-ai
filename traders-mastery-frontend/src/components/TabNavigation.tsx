import React from 'react'
import '../styles/tabs.css'

export type TabId = 'dashboard' | 'analysis' | 'terminal' | 'tracking'

interface Tab {
  id: TabId
  label: string
  icon: string
  description: string
}

interface TabNavigationProps {
  activeTab: TabId
  onTabChange: (tabId: TabId) => void
}

const tabs: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'Trading metrics and overview'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '🔍',
    description: 'Trade setup and AI analysis'
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: '💻',
    description: 'Live blockchain data'
  },
  {
    id: 'tracking',
    label: 'Tracking',
    icon: '📈',
    description: 'Trade outcomes and performance'
  }
]

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.description}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {activeTab === tab.id && <div className="tab-indicator" />}
          </button>
        ))}
      </div>
      
      <div className="tab-description">
        {tabs.find(tab => tab.id === activeTab)?.description}
      </div>
    </div>
  )
}