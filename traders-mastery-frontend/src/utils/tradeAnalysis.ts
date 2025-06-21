import type { BlockchainInsights } from '../services/backendApi'
import { claudeAnalyst } from '../services/claudeAnalyst'

// ============================================
//                CONSTANTS
// ============================================

// Risk Assessment Thresholds
const RISK_METRICS = {
  MIN_RISK_REWARD_RATIO: 1.5,
  EXCELLENT_RISK_REWARD: 3,
  GOOD_RISK_REWARD: 2,
  ACCEPTABLE_RISK_REWARD: 1.5,
  MAX_ACCEPTABLE_LOSS: 5,
  HIGH_RISK_LOSS: 10,
  MIN_PROFIT_TARGET: 3,
  HIGH_PROFIT_TARGET: 15
} as const

// Leverage Thresholds
const LEVERAGE_THRESHOLDS = {
  NONE: 1,
  LOW: 1,
  MODERATE: 5,
  HIGH: 10
} as const

// Volume Thresholds (in USD)
const VOLUME_THRESHOLDS = {
  LOW: 10_000_000,      // $10M
  MODERATE: 100_000_000, // $100M
  HIGH: 1_000_000_000   // $1B
} as const

// Flow Thresholds (in USD)
const FLOW_THRESHOLDS = {
  SMALL: 10_000_000,     // $10M
  MEDIUM: 25_000_000,    // $25M
  LARGE: 50_000_000,     // $50M
  HUGE: 100_000_000      // $100M
} as const

// Currency Conversion
const CURRENCY = {
  MILLION: 1_000_000,
  THOUSAND: 1_000,
  BILLION: 1_000_000_000
} as const

// Math Constants
const MATH = {
  PERCENTAGE_MULTIPLIER: 100,
  ROUNDING_PRECISION: 100
} as const

// Technical Analysis Terms
const TECHNICAL_TERMS = [
  'support', 'resistance', 'fibonacci', 'rsi', 'macd', 'moving average', 
  'bollinger', 'volume', 'trend', 'breakout', 'reversal', 'divergence',
  'oversold', 'overbought', 'momentum', 'pattern', 'channel'
] as const

// Validation Messages
const VALIDATION_MESSAGES = {
  PRICE_REQUIRED: 'must be greater than 0',
  FIELD_REQUIRED: 'is required',
  TAKE_PROFIT_INVALID: 'Take profit must be higher than entry price for long positions',
  STOP_LOSS_INVALID: 'Stop loss must be lower than entry price for long positions'
} as const

// ============================================
//              UTILITY FUNCTIONS
// ============================================

// Validation Utilities
function validatePrice(price: number, fieldName: string): string | null {
  if (!price || price <= 0) {
    return `${fieldName} ${VALIDATION_MESSAGES.PRICE_REQUIRED}`
  }
  return null
}

function validateRequiredField(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `${fieldName} ${VALIDATION_MESSAGES.FIELD_REQUIRED}`
  }
  return null
}

// Math Utilities
function roundToTwoDecimals(value: number): number {
  return Math.round(value * MATH.ROUNDING_PRECISION) / MATH.ROUNDING_PRECISION
}

function calculatePercentage(value: number, base: number): number {
  return (value / base) * MATH.PERCENTAGE_MULTIPLIER
}

// Currency Formatting Utilities
function formatCurrency(amount: number, unit: 'K' | 'M' | 'B' = 'M'): string {
  const divisors = { 
    K: CURRENCY.THOUSAND, 
    M: CURRENCY.MILLION, 
    B: CURRENCY.BILLION 
  }
  const decimals = unit === 'K' ? 0 : 1
  return `$${(amount / divisors[unit]).toFixed(decimals)}${unit}`
}

// Recommendation Management
function downgradeRecommendation(current: TradeAnalysis['recommendation']): TradeAnalysis['recommendation'] {
  const downgrades: Record<TradeAnalysis['recommendation'], TradeAnalysis['recommendation']> = {
    'STRONG_BUY': 'BUY',
    'BUY': 'HOLD',
    'HOLD': 'AVOID',
    'AVOID': 'STRONG_AVOID',
    'STRONG_AVOID': 'STRONG_AVOID'
  }
  return downgrades[current]
}

function adjustConfidence(current: number, change: number, min = 20, max = 95): number {
  return Math.max(min, Math.min(max, current + change))
}

// Risk Assessment Utilities
function assessRiskRewardRatio(ratio: number): {
  recommendation: TradeAnalysis['recommendation']
  confidence: number
  analysis: string
  keyPoint: string
} {
  if (ratio >= RISK_METRICS.EXCELLENT_RISK_REWARD) {
    return {
      recommendation: 'STRONG_BUY',
      confidence: 85,
      analysis: 'Excellent risk-reward ratio with strong upside potential.',
      keyPoint: `Outstanding ${ratio}:1 risk-reward ratio`
    }
  } else if (ratio >= RISK_METRICS.GOOD_RISK_REWARD) {
    return {
      recommendation: 'BUY',
      confidence: 75,
      analysis: 'Good risk-reward ratio that meets professional trading standards.',
      keyPoint: `Solid ${ratio}:1 risk-reward ratio`
    }
  } else if (ratio >= RISK_METRICS.ACCEPTABLE_RISK_REWARD) {
    return {
      recommendation: 'BUY',
      confidence: 65,
      analysis: 'Acceptable risk-reward ratio for experienced traders.',
      keyPoint: `Acceptable ${ratio}:1 risk-reward ratio`
    }
  } else if (ratio >= 1) {
    return {
      recommendation: 'HOLD',
      confidence: 45,
      analysis: 'Marginal risk-reward ratio. Consider waiting for better opportunities.',
      keyPoint: `Low ${ratio}:1 risk-reward ratio`
    }
  } else {
    return {
      recommendation: 'AVOID',
      confidence: 80,
      analysis: 'Poor risk-reward ratio where potential losses exceed gains.',
      keyPoint: 'Risk exceeds potential reward'
    }
  }
}

function assessLeverageRisk(leverage: number): {
  keyPoint?: string
  confidenceChange: number
  recommendationDowngrade: boolean
} {
  if (leverage > LEVERAGE_THRESHOLDS.HIGH) {
    return {
      keyPoint: `High leverage (${leverage}x) significantly increases risk`,
      confidenceChange: -20,
      recommendationDowngrade: true
    }
  } else if (leverage > LEVERAGE_THRESHOLDS.MODERATE) {
    return {
      keyPoint: `Moderate leverage (${leverage}x) increases risk`,
      confidenceChange: -10,
      recommendationDowngrade: false
    }
  } else if (leverage > LEVERAGE_THRESHOLDS.LOW) {
    return {
      keyPoint: `Low leverage (${leverage}x) - manageable risk increase`,
      confidenceChange: 0,
      recommendationDowngrade: false
    }
  }
  return { confidenceChange: 0, recommendationDowngrade: false }
}

function assessTimeFrameRisk(timeFrame: string): {
  risk: 'low' | 'medium' | 'high'
  keyPoint?: string
  confidenceChange: number
} {
  const cleaned = timeFrame.toLowerCase().trim()
  
  if (cleaned === 'scalping' || cleaned.startsWith('custom-') && 
      cleaned.includes('1m') || cleaned.includes('5m') || cleaned.includes('15m')) {
    return {
      risk: 'high',
      keyPoint: 'Scalping requires advanced skills and tight risk management',
      confidenceChange: 0
    }
  } else if (cleaned === 'day-trading' || cleaned === 'intraday' || 
             (cleaned.startsWith('custom-') && 
              (cleaned.includes('30m') || cleaned.includes('1h') || cleaned.includes('2h') ||
               cleaned.includes('4h') || cleaned.includes('6h') || cleaned.includes('8h') ||
               cleaned.includes('12h')))) {
    return {
      risk: 'medium',
      keyPoint: 'Day trading requires active monitoring and quick decision making',
      confidenceChange: 0
    }
  } else {
    return {
      risk: 'low',
      keyPoint: 'Swing trading allows for better analysis and less stress',
      confidenceChange: 5
    }
  }
}

export interface TradeSetup {
  tradingPair: string
  entryPrice: number
  entryReasoning: string
  takeProfitPrice: number
  takeProfitReasoning: string
  stopLossPrice: number
  stopLossReasoning: string
  positionSize: number  
  timeFrame: string
  leverage: number      
}

// Utility function to convert form data to typed trade setup
export function convertFormToTradeSetup(formData: {
  tradingPair: string
  entryPrice: string
  entryReasoning: string
  takeProfitPrice: string
  takeProfitReasoning: string
  stopLossPrice: string
  stopLossReasoning: string
  positionSize: string
  timeFrame: string
  leverage: string
}): TradeSetup {
  return {
    tradingPair: formData.tradingPair,
    entryReasoning: formData.entryReasoning,
    takeProfitReasoning: formData.takeProfitReasoning,
    stopLossReasoning: formData.stopLossReasoning,
    timeFrame: formData.timeFrame,
    entryPrice: parseFloat(formData.entryPrice),
    takeProfitPrice: parseFloat(formData.takeProfitPrice),
    stopLossPrice: parseFloat(formData.stopLossPrice),
    positionSize: parseFloat(formData.positionSize),
    leverage: parseLeverage(formData.leverage)
  }
}

export interface RiskMetrics {
  riskRewardRatio: number
  potentialProfit: number
  potentialLoss: number
  profitPercentage: number
  lossPercentage: number
  isValidSetup: boolean
  warnings: string[]
}

export interface TradeAnalysis {
  tradingPair: string 
  riskMetrics: RiskMetrics
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID'
  confidence: number
  analysis: string
  keyPoints: string[]
  blockchainInsights?: {
    whaleActivity: string[]
    volumeAnalysis: string[]
    liquidityFlow: string[]
  }
  aiInsights?: {
    provider: string
    reasoning: string
    riskAssessment: string
    blockchainAnalysis: string
    isAiGenerated: boolean
  }
}

export function validateTradeSetup(tradeSetup: TradeSetup): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Trading pair validation
  const tradingPairError = validateRequiredField(tradeSetup.tradingPair, 'Trading pair')
  if (tradingPairError) errors.push(tradingPairError)

  // Price validations
  const priceErrors = [
    validatePrice(tradeSetup.entryPrice, 'Entry price'),
    validatePrice(tradeSetup.takeProfitPrice, 'Take profit price'),
    validatePrice(tradeSetup.stopLossPrice, 'Stop loss price')
  ].filter(Boolean)
  errors.push(...priceErrors as string[])

  // Price relationship validations
  if (tradeSetup.entryPrice && tradeSetup.takeProfitPrice && tradeSetup.stopLossPrice) {
    if (tradeSetup.takeProfitPrice <= tradeSetup.entryPrice) {
      errors.push(VALIDATION_MESSAGES.TAKE_PROFIT_INVALID)
    }
    if (tradeSetup.stopLossPrice >= tradeSetup.entryPrice) {
      errors.push(VALIDATION_MESSAGES.STOP_LOSS_INVALID)
    }
  }

  // Reasoning validations
  const reasoningErrors = [
    validateRequiredField(tradeSetup.entryReasoning, 'Entry reasoning'),
    validateRequiredField(tradeSetup.takeProfitReasoning, 'Take profit reasoning'),
    validateRequiredField(tradeSetup.stopLossReasoning, 'Stop loss reasoning')
  ].filter(Boolean)
  errors.push(...reasoningErrors as string[])

  // Other validations
  const otherErrors = [
    validatePrice(tradeSetup.positionSize, 'Position size'),
    validateRequiredField(tradeSetup.timeFrame, 'Time frame'),
    validatePrice(tradeSetup.leverage, 'Leverage')
  ].filter(Boolean)
  errors.push(...otherErrors as string[])

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function calculateRiskMetrics(tradeSetup: TradeSetup): RiskMetrics {
  const warnings: string[] = []
  
  const potentialProfit = tradeSetup.takeProfitPrice - tradeSetup.entryPrice
  const potentialLoss = tradeSetup.entryPrice - tradeSetup.stopLossPrice
  
  const profitPercentage = calculatePercentage(potentialProfit, tradeSetup.entryPrice)
  const lossPercentage = calculatePercentage(potentialLoss, tradeSetup.entryPrice)
  
  const riskRewardRatio = potentialProfit / potentialLoss

  // Risk-reward warnings
  if (riskRewardRatio < RISK_METRICS.MIN_RISK_REWARD_RATIO) {
    warnings.push(`Risk-reward ratio below ${RISK_METRICS.MIN_RISK_REWARD_RATIO}:1 is generally not recommended`)
  }

  if (riskRewardRatio < 1) {
    warnings.push('Risk is greater than potential reward - high risk setup')
  }

  // Loss percentage warnings
  if (lossPercentage > RISK_METRICS.MAX_ACCEPTABLE_LOSS) {
    warnings.push(`Stop loss represents more than ${RISK_METRICS.MAX_ACCEPTABLE_LOSS}% loss - consider tighter risk management`)
  }

  // Profit percentage warnings
  if (profitPercentage < RISK_METRICS.MIN_PROFIT_TARGET) {
    warnings.push(`Profit target less than ${RISK_METRICS.MIN_PROFIT_TARGET}% - may not justify transaction costs`)
  }

  const isValidSetup = riskRewardRatio >= 1 && potentialProfit > 0 && potentialLoss > 0

  return {
    riskRewardRatio: roundToTwoDecimals(riskRewardRatio),
    potentialProfit: roundToTwoDecimals(potentialProfit),
    potentialLoss: roundToTwoDecimals(potentialLoss),
    profitPercentage: roundToTwoDecimals(profitPercentage),
    lossPercentage: roundToTwoDecimals(lossPercentage),
    isValidSetup,
    warnings
  }
}

export async function generateTradeRecommendation(
  riskMetrics: RiskMetrics, 
  tradeSetup: TradeSetup, 
  blockchainData?: BlockchainInsights
): Promise<TradeAnalysis> {
  // Try to use Claude AI for intelligent analysis first
  try {
    console.log('🤖 [AI] Attempting Claude AI analysis...')
    console.log('🔍 [AI Debug] Trade setup for Claude:', {
      pair: tradeSetup.tradingPair,
      entry: tradeSetup.entryPrice,
      hasBlockchainData: !!blockchainData
    })
    
    const claudeInsight = await claudeAnalyst.analyzeTradeWithClaude(tradeSetup, riskMetrics, blockchainData)
    
    console.log('🔍 [AI Debug] Claude response:', {
      recommendation: claudeInsight.recommendation,
      confidence: claudeInsight.confidence,
      analysisLength: claudeInsight.analysis.length
    })
    
    if (claudeInsight.recommendation !== 'HOLD' || claudeInsight.confidence > 60) {
      console.log('✅ [AI] Using Claude AI recommendation')
      
      // Use Claude's AI-generated analysis
      const aiAnalysis: TradeAnalysis = {
        tradingPair: tradeSetup.tradingPair,
        riskMetrics,
        recommendation: claudeInsight.recommendation,
        confidence: claudeInsight.confidence,
        analysis: claudeInsight.analysis,
        keyPoints: claudeInsight.keyInsights,
        aiInsights: {
          provider: 'Claude',
          reasoning: claudeInsight.reasoning,
          riskAssessment: claudeInsight.riskAssessment,
          blockchainAnalysis: claudeInsight.blockchainAnalysis,
          isAiGenerated: true
        }
      }
      
      // Still add blockchain insights if available
      if (blockchainData) {
        aiAnalysis.blockchainInsights = analyzeBlockchainData(blockchainData)
      }
      
      return aiAnalysis
    }
  } catch (error) {
    console.warn('⚠️ [AI] Claude analysis failed, falling back to rule-based logic:', error)
  }

  // Fallback to rule-based analysis if Claude is unavailable
  console.log('🔄 [Analysis] Using rule-based fallback analysis')
  
  let recommendation: TradeAnalysis['recommendation'] = 'HOLD'
  let confidence = 50
  let analysis = ''
  const keyPoints: string[] = []

  if (!riskMetrics.isValidSetup) {
    recommendation = 'STRONG_AVOID'
    confidence = 90
    analysis = 'This trade setup has fundamental issues that make it unsuitable for execution.'
    keyPoints.push('Invalid risk/reward structure')
    return { tradingPair: tradeSetup.tradingPair, riskMetrics, recommendation, confidence, analysis, keyPoints }
  }

  // Initial assessment based on risk-reward ratio
  const riskAssessment = assessRiskRewardRatio(riskMetrics.riskRewardRatio)
  recommendation = riskAssessment.recommendation
  confidence = riskAssessment.confidence
  analysis = riskAssessment.analysis
  keyPoints.push(riskAssessment.keyPoint)

  // Time frame risk assessment
  const timeFrameAssessment = assessTimeFrameRisk(tradeSetup.timeFrame)
  if (timeFrameAssessment.keyPoint) {
    keyPoints.push(timeFrameAssessment.keyPoint)
  }
  confidence = adjustConfidence(confidence, timeFrameAssessment.confidenceChange)
  
  // Special case: High leverage scalping is extremely dangerous
  if (timeFrameAssessment.risk === 'high' && tradeSetup.leverage > LEVERAGE_THRESHOLDS.MODERATE) {
    recommendation = 'STRONG_AVOID'
    confidence = 85
    analysis = 'High leverage scalping is extremely risky and not recommended.'
    return { tradingPair: tradeSetup.tradingPair, riskMetrics, recommendation, confidence, analysis, keyPoints }
  }

  // Leverage risk assessment
  const leverageAssessment = assessLeverageRisk(tradeSetup.leverage)
  if (leverageAssessment.keyPoint) {
    keyPoints.push(leverageAssessment.keyPoint)
  }
  confidence = adjustConfidence(confidence, leverageAssessment.confidenceChange, 25)
  
  if (leverageAssessment.recommendationDowngrade) {
    recommendation = downgradeRecommendation(recommendation)
  }

  // Loss percentage assessment
  if (riskMetrics.lossPercentage > RISK_METRICS.HIGH_RISK_LOSS) {
    recommendation = 'STRONG_AVOID'
    confidence = adjustConfidence(confidence, 20)
    keyPoints.push(`Excessive risk exposure (>${RISK_METRICS.HIGH_RISK_LOSS}% loss potential)`)
  } else if (riskMetrics.lossPercentage > RISK_METRICS.MAX_ACCEPTABLE_LOSS) {
    if (recommendation === 'STRONG_BUY') recommendation = downgradeRecommendation(recommendation)
    keyPoints.push('High risk exposure - consider reducing position size')
  }

  // Profit percentage assessment
  if (riskMetrics.profitPercentage > RISK_METRICS.HIGH_PROFIT_TARGET) {
    keyPoints.push('High profit potential')
    confidence = adjustConfidence(confidence, 10)
  }

  // Reasoning quality assessment
  const reasoningQuality = assessReasoningQuality(tradeSetup)
  if (reasoningQuality === 'poor') {
    recommendation = downgradeRecommendation(recommendation)
    keyPoints.push('Trade reasoning needs more detail and analysis')
    confidence = adjustConfidence(confidence, -15)
  } else if (reasoningQuality === 'good') {
    keyPoints.push('Well-reasoned trade setup')
    confidence = adjustConfidence(confidence, 5)
  }

  if (riskMetrics.warnings.length > 0) {
    keyPoints.push(...riskMetrics.warnings)
  }

  // Analyze blockchain data if available
  let blockchainInsights: TradeAnalysis['blockchainInsights'] | undefined
  if (blockchainData) {
    console.log('🤖 AI Processing blockchain data:', {
      whaleCount: blockchainData.whaleActivity.topHolders.length,
      largeTransfers: blockchainData.whaleActivity.recentLargeTransfers.length,
      totalVolume: blockchainData.volumeAnalysis.totalVolume,
      netFlow: blockchainData.liquidityIndicators.netFlow
    })
    
    blockchainInsights = analyzeBlockchainData(blockchainData)
    
    // Adjust recommendation based on blockchain insights
    const blockchainAdjustment = calculateBlockchainAdjustment(blockchainData)
    const originalRecommendation = recommendation
    const originalConfidence = confidence
    
    confidence = Math.max(20, Math.min(95, confidence + blockchainAdjustment.confidenceChange))
    
    if (blockchainAdjustment.recommendationBoost > 0) {
      if (recommendation === 'HOLD') recommendation = 'BUY'
      else if (recommendation === 'BUY' && blockchainAdjustment.recommendationBoost > 1) recommendation = 'STRONG_BUY'
    } else if (blockchainAdjustment.recommendationBoost < 0) {
      if (recommendation === 'STRONG_BUY') recommendation = 'BUY'
      else if (recommendation === 'BUY') recommendation = 'HOLD'
      else if (recommendation === 'HOLD') recommendation = 'AVOID'
    }
    
    console.log('🧠 AI Decision Process:', {
      originalRecommendation,
      finalRecommendation: recommendation,
      confidenceChange: `${originalConfidence}% → ${confidence}%`,
      blockchainBoost: blockchainAdjustment.recommendationBoost,
      whaleSignal: blockchainData.whaleActivity.whaleAccumulation ? 'ACCUMULATION' : 
                   blockchainData.whaleActivity.whaleDistribution ? 'DISTRIBUTION' : 'NEUTRAL',
      flowSignal: blockchainData.liquidityIndicators.netFlow > 0 ? 'OUTFLOW' : 'INFLOW'
    })
    
    keyPoints.push(...blockchainInsights.whaleActivity)
    keyPoints.push(...blockchainInsights.volumeAnalysis)
    keyPoints.push(...blockchainInsights.liquidityFlow)
  }

  return {
    tradingPair: tradeSetup.tradingPair,
    riskMetrics,
    recommendation,
    confidence,
    analysis,
    keyPoints,
    blockchainInsights
  }
}

function assessReasoningQuality(tradeSetup: TradeSetup): 'poor' | 'average' | 'good' {
  // Count total words across all reasoning fields
  const totalWords = [
    tradeSetup.entryReasoning,
    tradeSetup.takeProfitReasoning,
    tradeSetup.stopLossReasoning
  ].reduce((total, text) => total + text.split(' ').length, 0)

  // Combine all reasoning text for analysis
  const reasoningText = [
    tradeSetup.entryReasoning,
    tradeSetup.takeProfitReasoning,
    tradeSetup.stopLossReasoning
  ].join(' ').toLowerCase()

  // Count technical terms using constants
  const technicalTermCount = TECHNICAL_TERMS.reduce((count, term) => {
    return count + (reasoningText.includes(term) ? 1 : 0)
  }, 0)

  // Quality assessment thresholds
  const QUALITY_THRESHOLDS = {
    MIN_WORDS_POOR: 15,
    MIN_TERMS_POOR: 2,
    MIN_WORDS_GOOD: 50,
    MIN_TERMS_GOOD: 4
  }

  if (totalWords < QUALITY_THRESHOLDS.MIN_WORDS_POOR || technicalTermCount < QUALITY_THRESHOLDS.MIN_TERMS_POOR) {
    return 'poor'
  } else if (totalWords > QUALITY_THRESHOLDS.MIN_WORDS_GOOD && technicalTermCount >= QUALITY_THRESHOLDS.MIN_TERMS_GOOD) {
    return 'good'
  } else {
    return 'average'
  }
}

export function parsePositionSize(positionSizeStr: string): { type: 'percentage' | 'dollar' | 'invalid'; value: number } {
  const cleaned = positionSizeStr.trim().toLowerCase()
  
  if (cleaned.includes('%')) {
    const value = parseFloat(cleaned.replace('%', ''))
    return { type: 'percentage', value: isNaN(value) ? 0 : value }
  }
  
  if (cleaned.includes('$') || cleaned.includes('usd')) {
    const value = parseFloat(cleaned.replace(/[$,usd]/g, ''))
    return { type: 'dollar', value: isNaN(value) ? 0 : value }
  }
  
  const value = parseFloat(cleaned)
  if (!isNaN(value)) {
    return { type: 'dollar', value }
  }
  
  return { type: 'invalid', value: 0 }
}

export function parseLeverage(leverageStr: string): number {
  const cleaned = leverageStr.toLowerCase().trim()
  
  if (cleaned === 'none' || cleaned === 'no leverage (1x)') {
    return 1
  }
  
  if (cleaned.startsWith('custom-')) {
    const customMatch = cleaned.match(/custom-(\d+(?:\.\d+)?)x/)
    if (customMatch) {
      return parseFloat(customMatch[1])
    }
  }
  
  const match = cleaned.match(/(\d+(?:\.\d+)?)x/)
  if (match) {
    return parseFloat(match[1])
  }
  
  return 1
}


function analyzeBlockchainData(
  blockchainData: BlockchainInsights
) {
  const whaleActivity: string[] = []
  const volumeAnalysis: string[] = []
  const liquidityFlow: string[] = []

  // Whale Activity Analysis
  if (blockchainData.whaleActivity.whaleAccumulation) {
    whaleActivity.push('🐋 Whale accumulation detected - large holders increasing positions')
  }
  
  if (blockchainData.whaleActivity.whaleDistribution) {
    whaleActivity.push('📉 Whale distribution detected - large holders reducing positions')
  }

  if (blockchainData.whaleActivity.recentLargeTransfers.length > 0) {
    whaleActivity.push(`💰 ${blockchainData.whaleActivity.recentLargeTransfers.length} large transfers (>$100k) in last 24h`)
  }

  const topHolderBalance = blockchainData.whaleActivity.topHolders[0]?.balanceFormatted || 0
  if (topHolderBalance > 0) {
    whaleActivity.push(`🏛️ Top holder controls ${formatCurrency(topHolderBalance)} in tokens`)
  }

  // Volume Analysis
  const { totalVolume, transferCount } = blockchainData.volumeAnalysis
  const averageTransferSize = transferCount > 0 ? totalVolume / transferCount : 0
  
  // Volume categorization using constants
  if (totalVolume > VOLUME_THRESHOLDS.HIGH) {
    volumeAnalysis.push(`📊 High volume: ${formatCurrency(totalVolume, 'B')} in 24h activity`)
  } else if (totalVolume > VOLUME_THRESHOLDS.MODERATE) {
    volumeAnalysis.push(`📊 Moderate volume: ${formatCurrency(totalVolume)} in 24h activity`)
  } else {
    volumeAnalysis.push(`📊 Low volume: ${formatCurrency(totalVolume)} in 24h activity`)
  }

  if (transferCount > 0) {
    volumeAnalysis.push(`🔄 ${transferCount} transfers with avg size ${formatCurrency(averageTransferSize, 'K')}`)
  }

  // Liquidity Flow Analysis
  const { exchangeInflows, exchangeOutflows, netFlow } = blockchainData.liquidityIndicators
  
  // Flow categorization using constants
  if (netFlow > FLOW_THRESHOLDS.LARGE) {
    liquidityFlow.push(`📈 Strong exchange outflow: ${formatCurrency(netFlow)} (bullish signal)`)
  } else if (netFlow > FLOW_THRESHOLDS.SMALL) {
    liquidityFlow.push(`📈 Exchange outflow: ${formatCurrency(netFlow)} (positive signal)`)
  } else if (netFlow < -FLOW_THRESHOLDS.LARGE) {
    liquidityFlow.push(`📉 Heavy exchange inflow: ${formatCurrency(Math.abs(netFlow))} (bearish signal)`)
  } else if (netFlow < -FLOW_THRESHOLDS.SMALL) {
    liquidityFlow.push(`📉 Exchange inflow: ${formatCurrency(Math.abs(netFlow))} (negative signal)`)
  } else {
    liquidityFlow.push(`⚖️ Balanced exchange flows: minimal net movement`)
  }

  if (exchangeOutflows > 0) {
    liquidityFlow.push(`⬆️ Exchange outflows: ${formatCurrency(exchangeOutflows)}`)
  }
  if (exchangeInflows > 0) {
    liquidityFlow.push(`⬇️ Exchange inflows: ${formatCurrency(exchangeInflows)}`)
  }

  return {
    whaleActivity,
    volumeAnalysis,
    liquidityFlow
  }
}

function calculateBlockchainAdjustment(blockchainData: BlockchainInsights): {
  recommendationBoost: number
  confidenceChange: number
} {
  let recommendationBoost = 0
  let confidenceChange = 0

  // Whale activity impact
  if (blockchainData.whaleActivity.whaleAccumulation) {
    recommendationBoost += 1
    confidenceChange += 15
  }
  
  if (blockchainData.whaleActivity.whaleDistribution) {
    recommendationBoost -= 1
    confidenceChange -= 10
  }

  // Large transfer impact
  const largeTransferCount = blockchainData.whaleActivity.recentLargeTransfers.length
  if (largeTransferCount > 5) {
    confidenceChange += 10 // High activity increases confidence in trend
  }

  // Exchange flow impact using constants
  const { netFlow } = blockchainData.liquidityIndicators
  if (netFlow > FLOW_THRESHOLDS.HUGE) {
    recommendationBoost += 2
    confidenceChange += 20
  } else if (netFlow > FLOW_THRESHOLDS.MEDIUM) {
    recommendationBoost += 1
    confidenceChange += 10
  } else if (netFlow < -FLOW_THRESHOLDS.HUGE) {
    recommendationBoost -= 2
    confidenceChange += 15 // High certainty of bearish signal
  } else if (netFlow < -FLOW_THRESHOLDS.MEDIUM) {
    recommendationBoost -= 1
    confidenceChange += 10
  }

  // Volume impact using constants
  const { totalVolume } = blockchainData.volumeAnalysis
  if (totalVolume > VOLUME_THRESHOLDS.HIGH) {
    confidenceChange += 10 // High volume increases confidence
  } else if (totalVolume < VOLUME_THRESHOLDS.LOW) {
    confidenceChange -= 5 // Low volume decreases confidence
  }

  return {
    recommendationBoost: Math.max(-2, Math.min(2, recommendationBoost)),
    confidenceChange: Math.max(-20, Math.min(25, confidenceChange))
  }
}

