import React from 'react'
import '../styles/skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  animation?: 'pulse' | 'wave' | 'shimmer'
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  animation = 'shimmer',
  className = ''
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  }

  return (
    <div 
      className={`skeleton ${animation} ${className}`}
      style={style}
    />
  )
}

// Dashboard skeleton for metrics cards
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header">
        <Skeleton width="200px" height="32px" />
        <div className="skeleton-meta">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="100px" height="16px" />
        </div>
      </div>

      <div className="skeleton-metrics-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton-metric-card">
            <div className="skeleton-card-header">
              <Skeleton width="24px" height="24px" borderRadius="50%" />
              <Skeleton width="80px" height="16px" />
            </div>
            <Skeleton width="120px" height="28px" className="skeleton-metric-value" />
            <Skeleton width="100px" height="14px" />
          </div>
        ))}
      </div>

      <div className="skeleton-sections">
        <div className="skeleton-section">
          <Skeleton width="150px" height="20px" className="skeleton-section-title" />
          <div className="skeleton-trades-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-trade-item">
                <div className="skeleton-trade-info">
                  <Skeleton width="80px" height="16px" />
                  <Skeleton width="40px" height="20px" borderRadius="12px" />
                </div>
                <div className="skeleton-trade-details">
                  <Skeleton width="70px" height="16px" />
                  <Skeleton width="60px" height="16px" />
                </div>
                <Skeleton width="80px" height="14px" />
              </div>
            ))}
          </div>
        </div>

        <div className="skeleton-section">
          <Skeleton width="120px" height="20px" className="skeleton-section-title" />
          <div className="skeleton-stats-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-stat-item">
                <Skeleton width="100px" height="12px" />
                <Skeleton width="60px" height="18px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 200 }) => {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-chart-header">
        <Skeleton width="150px" height="20px" />
        <Skeleton width="24px" height="24px" borderRadius="4px" />
      </div>
      <div className="skeleton-chart-container" style={{ height }}>
        <Skeleton width="100%" height="100%" borderRadius="8px" />
        <div className="skeleton-chart-lines">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-chart-line" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Form skeleton
export const FormSkeleton: React.FC = () => {
  return (
    <div className="form-skeleton">
      <Skeleton width="200px" height="28px" className="skeleton-form-title" />
      
      <div className="skeleton-form-fields">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton-form-field">
            <Skeleton width="120px" height="16px" className="skeleton-field-label" />
            <Skeleton width="100%" height="40px" borderRadius="8px" />
          </div>
        ))}
      </div>

      <div className="skeleton-form-actions">
        <Skeleton width="120px" height="44px" borderRadius="8px" />
        <Skeleton width="80px" height="44px" borderRadius="8px" />
      </div>
    </div>
  )
}

// Terminal skeleton
export const TerminalSkeleton: React.FC = () => {
  return (
    <div className="terminal-skeleton">
      <div className="skeleton-terminal-header">
        <div className="skeleton-terminal-controls">
          <Skeleton width="12px" height="12px" borderRadius="50%" />
          <Skeleton width="12px" height="12px" borderRadius="50%" />
          <Skeleton width="12px" height="12px" borderRadius="50%" />
        </div>
        <Skeleton width="100px" height="16px" />
      </div>

      <div className="skeleton-terminal-content">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton-terminal-line">
            <Skeleton 
              width={`${60 + Math.random() * 40}%`} 
              height="16px" 
              animation="wave"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Table skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number 
  columns?: number 
}> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="table-skeleton">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton 
            key={index} 
            width="80px" 
            height="20px" 
            className="skeleton-table-header-cell"
          />
        ))}
      </div>

      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex}
                width={`${60 + Math.random() * 30}%`}
                height="16px"
                className="skeleton-table-cell"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Card skeleton
export const CardSkeleton: React.FC<{
  hasImage?: boolean
  lines?: number
}> = ({
  hasImage = false,
  lines = 3
}) => {
  return (
    <div className="card-skeleton">
      {hasImage && (
        <Skeleton 
          width="100%" 
          height="150px" 
          borderRadius="8px 8px 0 0" 
          className="skeleton-card-image"
        />
      )}
      
      <div className="skeleton-card-content">
        <Skeleton width="70%" height="20px" className="skeleton-card-title" />
        
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton 
            key={index}
            width={index === lines - 1 ? "60%" : "100%"}
            height="14px"
            className="skeleton-card-line"
          />
        ))}

        <div className="skeleton-card-actions">
          <Skeleton width="80px" height="32px" borderRadius="6px" />
          <Skeleton width="60px" height="32px" borderRadius="6px" />
        </div>
      </div>
    </div>
  )
}

// List skeleton
export const ListSkeleton: React.FC<{ 
  items?: number 
  avatar?: boolean 
}> = ({ 
  items = 5, 
  avatar = false 
}) => {
  return (
    <div className="list-skeleton">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          {avatar && (
            <Skeleton width="40px" height="40px" borderRadius="50%" />
          )}
          <div className="skeleton-list-content">
            <Skeleton width="150px" height="16px" />
            <Skeleton width="200px" height="14px" />
          </div>
          <Skeleton width="60px" height="12px" />
        </div>
      ))}
    </div>
  )
}