import React, { useState } from 'react'
import '../styles/floating-actions.css'

interface FloatingAction {
  id: string
  icon: string
  label: string
  color?: 'green' | 'blue' | 'orange' | 'red'
  action: () => void
  disabled?: boolean
  badge?: string | number
}

interface FloatingActionButtonProps {
  actions: FloatingAction[]
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  mainIcon?: string
  mainLabel?: string
  size?: 'small' | 'medium' | 'large'
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right',
  mainIcon = '⚡',
  mainLabel = 'Quick Actions',
  size = 'medium'
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={`fab-container ${position} ${size}`}>
      {/* Action Items */}
      <div className={`fab-actions ${isOpen ? 'open' : ''}`}>
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={`fab-action ${action.color || 'green'} ${action.disabled ? 'disabled' : ''}`}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : `${(actions.length - index - 1) * 50}ms`
            }}
            onClick={action.disabled ? undefined : action.action}
            title={action.label}
          >
            <span className="fab-action-icon">{action.icon}</span>
            <span className="fab-action-label">{action.label}</span>
            {action.badge && (
              <span className="fab-badge">{action.badge}</span>
            )}
          </div>
        ))}
      </div>

      {/* Main Button */}
      <button
        className={`fab-main ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        title={mainLabel}
      >
        <span className="fab-main-icon">{mainIcon}</span>
        <span className="fab-ripple"></span>
      </button>

      {/* Backdrop */}
      {isOpen && <div className="fab-backdrop" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// Quick Trade FAB specifically for trading actions
export const QuickTradeFAB: React.FC<{
  onNewTrade: () => void
  onQuickBuy: () => void
  onQuickSell: () => void
  onMarketScan: () => void
  onAlerts: () => void
  alertCount?: number
}> = ({
  onNewTrade,
  onQuickBuy,
  onQuickSell,
  onMarketScan,
  onAlerts,
  alertCount = 0
}) => {
  const actions: FloatingAction[] = [
    {
      id: 'new-trade',
      icon: '📈',
      label: 'New Trade',
      color: 'green',
      action: onNewTrade
    },
    {
      id: 'quick-buy',
      icon: '🟢',
      label: 'Quick Buy',
      color: 'green',
      action: onQuickBuy
    },
    {
      id: 'quick-sell',
      icon: '🔴',
      label: 'Quick Sell',
      color: 'red',
      action: onQuickSell
    },
    {
      id: 'market-scan',
      icon: '🔍',
      label: 'Market Scan',
      color: 'blue',
      action: onMarketScan
    },
    {
      id: 'alerts',
      icon: '🔔',
      label: 'Alerts',
      color: 'orange',
      action: onAlerts,
      badge: alertCount > 0 ? alertCount : undefined
    }
  ]

  return (
    <FloatingActionButton
      actions={actions}
      mainIcon="⚡"
      mainLabel="Quick Trading Actions"
      position="bottom-right"
    />
  )
}

// Speed Dial Component (Alternative FAB style)
export const SpeedDial: React.FC<{
  actions: FloatingAction[]
  direction?: 'up' | 'down' | 'left' | 'right'
  mainIcon?: string
}> = ({
  actions,
  direction = 'up',
  mainIcon = '+'
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`speed-dial ${direction}`}>
      <div className={`speed-dial-actions ${isOpen ? 'open' : ''}`}>
        {actions.map((action, index) => (
          <button
            key={action.id}
            className={`speed-dial-action ${action.color || 'green'}`}
            onClick={action.action}
            title={action.label}
            style={{
              transitionDelay: isOpen ? `${index * 30}ms` : '0ms'
            }}
          >
            {action.icon}
            {action.badge && (
              <span className="speed-dial-badge">{action.badge}</span>
            )}
          </button>
        ))}
      </div>
      
      <button
        className={`speed-dial-main ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {mainIcon}
      </button>
    </div>
  )
}

// Floating Widget (draggable mini window)
export const FloatingWidget: React.FC<{
  title: string
  children: React.ReactNode
  defaultPosition?: { x: number; y: number }
  onClose?: () => void
  minimizable?: boolean
}> = ({
  title,
  children,
  defaultPosition = { x: 20, y: 20 },
  onClose,
  minimizable = true
}) => {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart, handleMouseMove])

  return (
    <div
      className={`floating-widget ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <div
        className="floating-widget-header"
        onMouseDown={handleMouseDown}
      >
        <span className="widget-title">{title}</span>
        <div className="widget-controls">
          {minimizable && (
            <button
              className="widget-control minimize"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? '🔲' : '➖'}
            </button>
          )}
          {onClose && (
            <button
              className="widget-control close"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {!isMinimized && (
        <div className="floating-widget-content">
          {children}
        </div>
      )}
    </div>
  )
}