import React, { useState, useEffect } from 'react'
import { enhancedWhaleApi, type EnhancedWhaleIntelligence } from '../services/enhancedWhaleApi'
import { Skeleton } from './SkeletonLoader'
import '../styles/enhanced-whale-intelligence.css'

interface EnhancedWhaleIntelligenceProps {
  tradingPair: string
  className?: string
}

export const EnhancedWhaleIntelligenceComponent: React.FC<EnhancedWhaleIntelligenceProps> = ({
  tradingPair,
  className = ''
}) => {
  const [whaleData, setWhaleData] = useState<EnhancedWhaleIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tradingPair) {
      fetchWhaleIntelligence()
    }
  }, [tradingPair])

  const fetchWhaleIntelligence = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await enhancedWhaleApi.getEnhancedWhaleIntelligence(tradingPair)
      setWhaleData(data)
    } catch (err) {
      setError('Failed to fetch whale intelligence')
      console.error('Whale intelligence fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!tradingPair) {
    return (
      <div className={`enhanced-whale-intelligence ${className}`}>
        <h3>🐋 Enhanced Whale Intelligence</h3>
        <div className="whale-placeholder">
          <p>Enter a trading pair to analyze whale activity</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`enhanced-whale-intelligence ${className}`}>
        <h3>🐋 Enhanced Whale Intelligence</h3>
        <Skeleton height={200} />
      </div>
    )
  }

  if (error || !whaleData) {
    return (
      <div className={`enhanced-whale-intelligence ${className}`}>
        <h3>🐋 Enhanced Whale Intelligence</h3>
        <div className="whale-error">
          <span className="error-icon">⚠️</span>
          <p>{error || 'No whale data available'}</p>
          <button onClick={fetchWhaleIntelligence} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { tiers, behavior, predictions } = whaleData

  return (
    <div className={`enhanced-whale-intelligence ${className}`}>
      <div className="whale-header">
        <h3>🐋 Enhanced Whale Intelligence</h3>
        <div className="whale-meta">
          <span className="pair-name">{tradingPair}</span>
          <span className="last-updated">
            Updated: {new Date(whaleData.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Whale Tiers Overview */}
      <div className="whale-tiers-section">
        <h4>Whale Distribution</h4>
        <div className="whale-tiers-grid">
          <div className="tier-card mega">
            <div className="tier-header">
              <span className="tier-icon">🐋</span>
              <span className="tier-name">Mega Whales</span>
            </div>
            <div className="tier-count">{tiers.megaWhales.length}</div>
            <div className="tier-info">
              {tiers.megaWhales.length > 0 && (
                <div className="top-whale">
                  Top: {enhancedWhaleApi.formatPercentage(tiers.megaWhales[0].percentage)}
                </div>
              )}
            </div>
          </div>

          <div className="tier-card whale">
            <div className="tier-header">
              <span className="tier-icon">🐳</span>
              <span className="tier-name">Whales</span>
            </div>
            <div className="tier-count">{tiers.whales.length}</div>
          </div>

          <div className="tier-card dolphin">
            <div className="tier-header">
              <span className="tier-icon">🐬</span>
              <span className="tier-name">Dolphins</span>
            </div>
            <div className="tier-count">{tiers.dolphins.length}</div>
          </div>

          <div className="tier-card total">
            <div className="tier-header">
              <span className="tier-icon">👥</span>
              <span className="tier-name">Total Holders</span>
            </div>
            <div className="tier-count">{tiers.totalHolders.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Concentration Risk */}
      <div className="concentration-section">
        <h4>Concentration Analysis</h4>
        <div className="concentration-grid">
          <div className="concentration-metric">
            <span className="metric-label">Top 10 Holdings</span>
            <span className="metric-value">{tiers.concentration.top10Percentage.toFixed(1)}%</span>
          </div>
          <div className="concentration-metric">
            <span className="metric-label">Top 50 Holdings</span>
            <span className="metric-value">{tiers.concentration.top50Percentage.toFixed(1)}%</span>
          </div>
          <div className="concentration-metric">
            <span className="metric-label">Concentration Risk</span>
            <span 
              className={`metric-value risk-${tiers.concentration.concentrationRisk.toLowerCase()}`}
              style={{ color: enhancedWhaleApi.getRiskLevelColor(tiers.concentration.concentrationRisk) }}
            >
              {tiers.concentration.concentrationRisk}
            </span>
          </div>
        </div>
      </div>

      {/* Whale Behavior */}
      <div className="behavior-section">
        <h4>Whale Behavior Analysis</h4>
        <div className="behavior-overview">
          <div className="behavior-main">
            <div className="activity-indicator">
              <span 
                className="activity-icon"
                style={{ color: enhancedWhaleApi.getActivityDisplay(behavior.recentActivity).color }}
              >
                {enhancedWhaleApi.getActivityDisplay(behavior.recentActivity).icon}
              </span>
              <span className="activity-label">
                {enhancedWhaleApi.getActivityDisplay(behavior.recentActivity).label}
              </span>
            </div>
            
            <div className="confidence-score">
              <span className="confidence-label">Confidence</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ width: `${behavior.confidenceScore * 100}%` }}
                />
              </div>
              <span className="confidence-value">{(behavior.confidenceScore * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="behavior-stats">
            <div className="behavior-stat">
              <span className="stat-label">Buy Pressure</span>
              <div className="pressure-bar buy">
                <div 
                  className="pressure-fill"
                  style={{ width: `${behavior.patterns.buyPressure}%` }}
                />
              </div>
              <span className="stat-value">{behavior.patterns.buyPressure}%</span>
            </div>

            <div className="behavior-stat">
              <span className="stat-label">Sell Pressure</span>
              <div className="pressure-bar sell">
                <div 
                  className="pressure-fill"
                  style={{ width: `${behavior.patterns.sellPressure}%` }}
                />
              </div>
              <span className="stat-value">{behavior.patterns.sellPressure}%</span>
            </div>

            <div className="behavior-stat">
              <span className="stat-label">HODL Strength</span>
              <div className="pressure-bar hodl">
                <div 
                  className="pressure-fill"
                  style={{ width: `${behavior.patterns.hodlStrength}%` }}
                />
              </div>
              <span className="stat-value">{behavior.patterns.hodlStrength}%</span>
            </div>
          </div>
        </div>

        {behavior.coordinatedMovements > 0 && (
          <div className="coordination-alert">
            <span className="coordination-icon">🚨</span>
            <span className="coordination-text">
              {behavior.coordinatedMovements} coordinated whale movements detected
            </span>
          </div>
        )}
      </div>

      {/* Predictions & Recommendations */}
      <div className="predictions-section">
        <h4>Whale-Based Predictions</h4>
        
        <div className="prediction-overview">
          <div className="price-impact">
            <div className="impact-direction">
              <span className={`direction-indicator ${predictions.priceImpact.direction}`}>
                {predictions.priceImpact.direction === 'bullish' ? '📈' : 
                 predictions.priceImpact.direction === 'bearish' ? '📉' : '↔️'}
              </span>
              <span className="direction-label">
                {predictions.priceImpact.direction.toUpperCase()}
              </span>
            </div>
            
            <div className="impact-details">
              <span className="impact-magnitude">
                {predictions.priceImpact.magnitude.toUpperCase()} impact
              </span>
              <span className="impact-timeframe">
                {predictions.priceImpact.timeframe} timeframe
              </span>
              <span className="impact-confidence">
                {predictions.priceImpact.confidence}% confidence
              </span>
            </div>
          </div>

          <div className="recommendation-card">
            <div 
              className="recommendation-action"
              style={{
                background: enhancedWhaleApi.getRecommendationStyle(predictions.recommendation.action).background,
                color: enhancedWhaleApi.getRecommendationStyle(predictions.recommendation.action).color
              }}
            >
              <span className="action-icon">
                {enhancedWhaleApi.getRecommendationStyle(predictions.recommendation.action).icon}
              </span>
              <span className="action-text">
                {predictions.recommendation.action}
              </span>
            </div>
            
            <div className="recommendation-risk">
              Risk: <span 
                style={{ color: enhancedWhaleApi.getRiskLevelColor(predictions.recommendation.riskLevel) }}
              >
                {predictions.recommendation.riskLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="reasoning-section">
          <h5>Analysis Reasoning</h5>
          <ul className="reasoning-list">
            {predictions.recommendation.reasoning.map((reason, index) => (
              <li key={index} className="reasoning-item">
                <span className="reasoning-bullet">•</span>
                <span className="reasoning-text">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Historical Accuracy */}
      <div className="accuracy-footer">
        <div className="accuracy-metric">
          <span className="accuracy-label">Historical Accuracy:</span>
          <span className="accuracy-value">{behavior.historicalAccuracy}%</span>
        </div>
        <div className="hold-time">
          <span className="hold-label">Avg. Hold Time:</span>
          <span className="hold-value">{behavior.averageHoldTime}</span>
        </div>
      </div>
    </div>
  )
}