import { useMemo } from 'react'
import '../styles/risk-calculator.css'

interface RiskCalculatorProps {
  entryPrice: string
  takeProfitPrice: string
  stopLossPrice: string
  positionSize: string
  leverage?: string
  accountBalance?: number
  riskPercentage?: number
  onPositionSizeChange?: (size: string) => void
}

export function RiskCalculator({
  entryPrice,
  takeProfitPrice, 
  stopLossPrice,
  positionSize,
  leverage = '1',
  accountBalance = 10000, // Default $10k account
  riskPercentage = 2, // Default 2% risk
  onPositionSizeChange
}: RiskCalculatorProps) {
  
  const calculations = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0
    const tp = parseFloat(takeProfitPrice) || 0
    const sl = parseFloat(stopLossPrice) || 0
    const size = parseFloat(positionSize) || 0
    const lev = parseFloat(leverage) || 1
    
    if (!entry) return null
    
    // Determine trade direction
    const isLong = tp > entry
    const isValidSetup = isLong ? (sl < entry && tp > entry) : (sl > entry && tp < entry)
    
    if (!isValidSetup) {
      return {
        isValid: false,
        error: isLong ? 'For long trades: Stop Loss < Entry < Take Profit' : 'For short trades: Take Profit < Entry < Stop Loss'
      }
    }
    
    // Calculate percentages
    const riskPercent = Math.abs((entry - sl) / entry) * 100
    const rewardPercent = Math.abs((tp - entry) / entry) * 100
    const riskRewardRatio = rewardPercent / riskPercent
    
    // Calculate dollar amounts with leverage
    const leveragedRisk = riskPercent * lev
    const leveragedReward = rewardPercent * lev
    const potentialLoss = size * (leveragedRisk / 100)
    const potentialProfit = size * (leveragedReward / 100)
    
    // Account risk calculations (with leverage)
    const accountRiskDollar = accountBalance * (riskPercentage / 100)
    const suggestedPositionSize = accountRiskDollar / (leveragedRisk / 100)
    const currentAccountRisk = (potentialLoss / accountBalance) * 100
    
    return {
      isValid: true,
      riskPercent: riskPercent.toFixed(2),
      rewardPercent: rewardPercent.toFixed(2),
      leveragedRisk: leveragedRisk.toFixed(2),
      leveragedReward: leveragedReward.toFixed(2),
      riskRewardRatio: riskRewardRatio.toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      suggestedPositionSize: suggestedPositionSize.toFixed(0),
      currentAccountRisk: currentAccountRisk.toFixed(2),
      accountRiskDollar: accountRiskDollar.toFixed(0),
      leverage: lev.toFixed(1)
    }
  }, [entryPrice, takeProfitPrice, stopLossPrice, positionSize, leverage, accountBalance, riskPercentage])
  
  if (!calculations) {
    return (
      <div className="risk-calculator">
        <h3>🧮 Risk Calculator</h3>
        <div className="calculator-placeholder">
          <p>Enter entry price to start calculating risk metrics</p>
        </div>
      </div>
    )
  }
  
  if (!calculations.isValid) {
    return (
      <div className="risk-calculator">
        <h3>🧮 Risk Calculator</h3>
        <div className="calculator-error">
          <span className="error-icon">⚠️</span>
          <p>{calculations.error}</p>
        </div>
      </div>
    )
  }
  
  const riskLevel = parseFloat(calculations.currentAccountRisk || '0') > 5 ? 'high' : 
                   parseFloat(calculations.currentAccountRisk || '0') > 2 ? 'medium' : 'low'
  
  const rrLevel = parseFloat(calculations.riskRewardRatio || '0') >= 3 ? 'excellent' :
                  parseFloat(calculations.riskRewardRatio || '0') >= 2 ? 'good' :
                  parseFloat(calculations.riskRewardRatio || '0') >= 1.5 ? 'fair' : 'poor'
  
  return (
    <div className="risk-calculator">
      <h3>🧮 Risk Calculator</h3>
      
      {/* Quick Stats */}
      <div className="risk-stats">
        <div className={`stat-card risk-${riskLevel}`}>
          <label>Account Risk</label>
          <span className="stat-value">{calculations.currentAccountRisk}%</span>
        </div>
        
        <div className={`stat-card rr-${rrLevel}`}>
          <label>Risk:Reward</label>
          <span className="stat-value">1:{calculations.riskRewardRatio}</span>
        </div>
      </div>
      
      {/* Leverage Info */}
      {parseFloat(calculations.leverage || '1') > 1 && (
        <div className="leverage-warning">
          <span className="leverage-icon">⚡</span>
          <span>Using {calculations.leverage}x leverage</span>
          <div className="leverage-impact">Risk amplified by {calculations.leverage}x</div>
        </div>
      )}
      
      {/* Position Size Suggestion */}
      <div className="position-suggestion">
        <div className="suggestion-header">
          <span className="suggestion-icon">💡</span>
          <span>Suggested Position Size</span>
        </div>
        <div className="suggestion-amount">
          ${calculations.suggestedPositionSize}
        </div>
        <div className="suggestion-desc">
          For {riskPercentage}% account risk (${calculations.accountRiskDollar})
        </div>
        {onPositionSizeChange && (
          <button
            type="button"
            className="apply-suggestion-btn"
            onClick={() => onPositionSizeChange(calculations.suggestedPositionSize || '0')}
          >
            Apply This Size
          </button>
        )}
      </div>
      
      {/* Detailed Metrics */}
      <div className="detailed-metrics">
        <div className="metric-row">
          <span className="metric-label">Potential Loss</span>
          <span className="metric-value loss">${calculations.potentialLoss}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">Potential Profit</span>
          <span className="metric-value profit">${calculations.potentialProfit}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">Base Risk %</span>
          <span className="metric-value">{calculations.riskPercent}%</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">Leveraged Risk %</span>
          <span className="metric-value">{calculations.leveragedRisk}%</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">Base Reward %</span>
          <span className="metric-value">{calculations.rewardPercent}%</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">Leveraged Reward %</span>
          <span className="metric-value">{calculations.leveragedReward}%</span>
        </div>
      </div>
      
      {/* Risk Presets */}
      <div className="risk-presets">
        <h4>Quick Risk Levels</h4>
        <div className="preset-buttons">
          {[1, 2, 3, 5].map(risk => {
            const leveragedRiskPercent = parseFloat(calculations.leveragedRisk || '1')
            const presetSize = (accountBalance * (risk / 100)) / (leveragedRiskPercent / 100)
            return (
              <button
                key={risk}
                type="button"
                className={`preset-btn ${risk === riskPercentage ? 'active' : ''}`}
                onClick={() => onPositionSizeChange?.(presetSize.toFixed(0))}
                title={`${risk}% account risk = $${presetSize.toFixed(0)} position (${calculations.leverage}x leverage)`}
              >
                {risk}%
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}