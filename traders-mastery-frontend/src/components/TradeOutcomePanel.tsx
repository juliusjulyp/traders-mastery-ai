import { useState, useEffect } from 'react'
import type { TradeOutcome, TradePerformanceMetrics } from '../types/tradeOutcome'
import type { TradeAnalysis } from '../utils/tradeAnalysis'
import { tradeOutcomeService } from '../services/tradeOutcomeService'

interface TradeOutcomePanelProps {
  analysis: TradeAnalysis | null
  tradingPair: string
  tradeSetup: {
    entryPrice: number
    takeProfitPrice: number
    stopLossPrice: number
    positionSize: number
    leverage: number
    timeFrame: string
  }
  sessionId: string
}

export function TradeOutcomePanel({ analysis, tradingPair, tradeSetup, sessionId }: TradeOutcomePanelProps) {
  const [currentOutcome, setCurrentOutcome] = useState<TradeOutcome | null>(null)
  const [showTrackingPanel, setShowTrackingPanel] = useState(false)
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [exitReason, setExitReason] = useState<TradeOutcome['exitReason']>('manual')
  const [entryNotes, setEntryNotes] = useState('')
  const [exitNotes, setExitNotes] = useState('')

  // Create trade outcome record when analysis is completed
  useEffect(() => {
    if (analysis && tradingPair && !currentOutcome) {
      const outcome = tradeOutcomeService.createTradeOutcome(
        analysis,
        {
          tradingPair,
          entryPrice: tradeSetup.entryPrice,
          takeProfitPrice: tradeSetup.takeProfitPrice,
          stopLossPrice: tradeSetup.stopLossPrice,
          positionSize: tradeSetup.positionSize,
          leverage: tradeSetup.leverage,
          timeFrame: tradeSetup.timeFrame
        },
        sessionId
      )
      setCurrentOutcome(outcome)
    }
  }, [analysis, tradingPair, tradeSetup, sessionId, currentOutcome])

  const handleRecordEntry = () => {
    if (!currentOutcome || !entryPrice) return

    const success = tradeOutcomeService.recordTradeEntry(
      currentOutcome.id,
      parseFloat(entryPrice),
      entryNotes
    )

    if (success) {
      const updated = tradeOutcomeService.getTradeOutcomes().find(o => o.id === currentOutcome.id)
      if (updated) {
        setCurrentOutcome(updated)
        setEntryPrice('')
        setEntryNotes('')
      }
    }
  }

  const handleRecordExit = () => {
    if (!currentOutcome || !exitPrice || !exitReason) return

    const success = tradeOutcomeService.recordTradeExit(
      currentOutcome.id,
      parseFloat(exitPrice),
      exitReason,
      exitNotes
    )

    if (success) {
      const updated = tradeOutcomeService.getTradeOutcomes().find(o => o.id === currentOutcome.id)
      if (updated) {
        setCurrentOutcome(updated)
        setExitPrice('')
        setExitNotes('')
        setExitReason('manual')
      }
    }
  }

  const getStatusColor = (status: TradeOutcome['status']) => {
    switch (status) {
      case 'planned': return 'blue'
      case 'entered': return 'orange'
      case 'exited': return currentOutcome?.actualPnL && currentOutcome.actualPnL > 0 ? 'green' : 'red'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  const formatPnL = (pnl: number | null) => {
    if (pnl === null) return 'N/A'
    const color = pnl >= 0 ? 'green' : 'red'
    const sign = pnl >= 0 ? '+' : ''
    return <span className={`pnl ${color}`}>{sign}${pnl.toFixed(2)}%</span>
  }

  if (!analysis || !currentOutcome) {
    return null
  }

  return (
    <div className="trade-outcome-panel">
      <div className="panel-header">
        <h3>📊 Trade Tracking</h3>
        <button 
          className="toggle-tracking"
          onClick={() => setShowTrackingPanel(!showTrackingPanel)}
        >
          {showTrackingPanel ? 'Hide' : 'Show'} Tracking
        </button>
      </div>

      {/* Trade Status Summary */}
      <div className="trade-status">
        <div className="status-item">
          <label>Status:</label>
          <span className={`status ${getStatusColor(currentOutcome.status)}`}>
            {currentOutcome.status.toUpperCase()}
          </span>
        </div>
        
        <div className="status-item">
          <label>Trading Pair:</label>
          <span>{currentOutcome.originalAnalysis.tradingPair}</span>
        </div>

        <div className="status-item">
          <label>AI Recommendation:</label>
          <span className={`recommendation ${currentOutcome.originalAnalysis.recommendation.toLowerCase()}`}>
            {currentOutcome.originalAnalysis.recommendation} ({currentOutcome.originalAnalysis.confidence}%)
          </span>
        </div>

        {currentOutcome.actualPnL !== null && (
          <div className="status-item">
            <label>P&L:</label>
            {formatPnL(currentOutcome.actualPnLPercentage)}
          </div>
        )}
      </div>

      {/* Expanded Tracking Panel */}
      {showTrackingPanel && (
        <div className="tracking-panel">
          
          {/* Entry Tracking */}
          {currentOutcome.status === 'planned' && (
            <div className="tracking-section">
              <h4>🎯 Record Trade Entry</h4>
              <div className="input-group">
                <label>Actual Entry Price:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder={`Planned: $${currentOutcome.tradeSetup.entryPrice}`}
                />
              </div>
              <div className="input-group">
                <label>Entry Notes:</label>
                <textarea
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="Why did you enter at this price? Market conditions, timing, etc."
                  rows={2}
                />
              </div>
              <button 
                className="record-btn entry"
                onClick={handleRecordEntry}
                disabled={!entryPrice}
              >
                Record Entry
              </button>
            </div>
          )}

          {/* Exit Tracking */}
          {currentOutcome.status === 'entered' && (
            <div className="tracking-section">
              <h4>🚪 Record Trade Exit</h4>
              <div className="input-group">
                <label>Actual Exit Price:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="Exit price"
                />
              </div>
              <div className="input-group">
                <label>Exit Reason:</label>
                <select
                  value={exitReason || 'manual'}
                  onChange={(e) => setExitReason(e.target.value as TradeOutcome['exitReason'])}
                >
                  <option value="take_profit">Take Profit Hit</option>
                  <option value="stop_loss">Stop Loss Hit</option>
                  <option value="manual">Manual Exit</option>
                  <option value="time_based">Time-based Exit</option>
                </select>
              </div>
              <div className="input-group">
                <label>Exit Notes:</label>
                <textarea
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                  placeholder="Why did you exit? What did you learn?"
                  rows={2}
                />
              </div>
              <button 
                className="record-btn exit"
                onClick={handleRecordExit}
                disabled={!exitPrice || !exitReason}
              >
                Record Exit
              </button>
            </div>
          )}

          {/* Completed Trade Summary */}
          {currentOutcome.status === 'exited' && (
            <div className="tracking-section completed">
              <h4>✅ Trade Completed</h4>
              <div className="completed-summary">
                <div className="summary-row">
                  <label>Entry:</label>
                  <span>${currentOutcome.actualEntry}</span>
                </div>
                <div className="summary-row">
                  <label>Exit:</label>
                  <span>${currentOutcome.actualExit}</span>
                </div>
                <div className="summary-row">
                  <label>P&L:</label>
                  {formatPnL(currentOutcome.actualPnLPercentage)}
                </div>
                <div className="summary-row">
                  <label>Exit Reason:</label>
                  <span className="exit-reason">{currentOutcome.exitReason?.replace('_', ' ')}</span>
                </div>
                <div className="summary-row">
                  <label>Hold Time:</label>
                  <span>{currentOutcome.timeHeld ? formatHoldTime(currentOutcome.timeHeld) : 'N/A'}</span>
                </div>
                
                {/* AI Accuracy Display */}
                {currentOutcome.aiAccuracy.directionCorrect !== null && (
                  <div className="ai-accuracy">
                    <h5>🤖 AI Performance</h5>
                    <div className="accuracy-item">
                      <label>Direction Correct:</label>
                      <span className={currentOutcome.aiAccuracy.directionCorrect ? 'correct' : 'incorrect'}>
                        {currentOutcome.aiAccuracy.directionCorrect ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="accuracy-item">
                      <label>Confidence Justified:</label>
                      <span className={currentOutcome.aiAccuracy.confidenceJustified ? 'correct' : 'incorrect'}>
                        {currentOutcome.aiAccuracy.confidenceJustified ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trade Details */}
          <div className="tracking-section">
            <h4>📋 Trade Details</h4>
            <div className="trade-details">
              <div className="detail-row">
                <label>Planned Entry:</label>
                <span>${currentOutcome.tradeSetup.entryPrice}</span>
              </div>
              <div className="detail-row">
                <label>Take Profit:</label>
                <span>${currentOutcome.tradeSetup.takeProfitPrice}</span>
              </div>
              <div className="detail-row">
                <label>Stop Loss:</label>
                <span>${currentOutcome.tradeSetup.stopLossPrice}</span>
              </div>
              <div className="detail-row">
                <label>Position Size:</label>
                <span>${currentOutcome.tradeSetup.positionSize}</span>
              </div>
              <div className="detail-row">
                <label>Leverage:</label>
                <span>{currentOutcome.tradeSetup.leverage}x</span>
              </div>
              <div className="detail-row">
                <label>Time Frame:</label>
                <span>{currentOutcome.tradeSetup.timeFrame}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// Performance Metrics Component
interface PerformanceMetricsProps {
  sessionId?: string
}

export function PerformanceMetrics({ sessionId }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<TradePerformanceMetrics | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)

  useEffect(() => {
    const updateMetrics = () => {
      const performanceMetrics = tradeOutcomeService.getPerformanceMetrics()
      setMetrics(performanceMetrics)
    }

    updateMetrics()
    
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000)
    return () => clearInterval(interval)
  }, [sessionId])

  if (!metrics || metrics.totalTrades === 0) {
    return null
  }

  return (
    <div className="performance-metrics">
      <div className="metrics-header">
        <h3>📈 Trading Performance</h3>
        <button 
          className="toggle-metrics"
          onClick={() => setShowMetrics(!showMetrics)}
        >
          {showMetrics ? 'Hide' : 'Show'} Metrics
        </button>
      </div>

      {/* Quick Stats Always Visible */}
      <div className="quick-stats">
        <div className="stat">
          <label>Total Trades:</label>
          <span>{metrics.totalTrades}</span>
        </div>
        <div className="stat">
          <label>Win Rate:</label>
          <span className={metrics.winRate >= 50 ? 'positive' : 'negative'}>
            {metrics.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="stat">
          <label>Total P&L:</label>
          <span className={metrics.totalPnL >= 0 ? 'positive' : 'negative'}>
            {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
          </span>
        </div>
        <div className="stat">
          <label>AI Accuracy:</label>
          <span className={metrics.aiAccuracyRate >= 60 ? 'positive' : 'negative'}>
            {metrics.aiAccuracyRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showMetrics && (
        <div className="detailed-metrics">
          <div className="metrics-grid">
            <div className="metric-group">
              <h4>📊 Trading Stats</h4>
              <div className="metric-item">
                <label>Completed Trades:</label>
                <span>{metrics.completedTrades}</span>
              </div>
              <div className="metric-item">
                <label>Winning Trades:</label>
                <span>{metrics.winningTrades}</span>
              </div>
              <div className="metric-item">
                <label>Losing Trades:</label>
                <span>{metrics.losingTrades}</span>
              </div>
              <div className="metric-item">
                <label>Best Time Frame:</label>
                <span>{metrics.bestTimeFrame || 'N/A'}</span>
              </div>
            </div>

            <div className="metric-group">
              <h4>💰 P&L Analysis</h4>
              <div className="metric-item">
                <label>Average Win:</label>
                <span className="positive">+${metrics.averageWin.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <label>Average Loss:</label>
                <span className="negative">-${metrics.averageLoss.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <label>Profit Factor:</label>
                <span className={metrics.profitFactor >= 1.5 ? 'positive' : 'negative'}>
                  {metrics.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="metric-item">
                <label>Expectancy:</label>
                <span className={metrics.expectancy >= 0 ? 'positive' : 'negative'}>
                  ${metrics.expectancy.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="metric-group">
              <h4>⚠️ Risk Metrics</h4>
              <div className="metric-item">
                <label>Largest Win:</label>
                <span className="positive">+${metrics.largestWin.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <label>Largest Loss:</label>
                <span className="negative">${metrics.largestLoss.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <label>Max Drawdown:</label>
                <span className="negative">-${metrics.maxDrawdown.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <label>Max Consecutive Wins:</label>
                <span>{metrics.maxConsecutiveWins}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format hold time
function formatHoldTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}