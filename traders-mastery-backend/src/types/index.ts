// Shared types for backend API

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

export interface RiskMetrics {
  riskRewardRatio: number
  potentialProfit: number
  potentialLoss: number
  profitPercentage: number
  lossPercentage: number
  warnings: string[]
}

export interface BlockchainInsights {
  whaleActivity: {
    whaleAccumulation: boolean
    whaleDistribution: boolean
    recentLargeTransfers: Array<{
      amount: number
      direction: 'in' | 'out'
      timestamp: number
    }>
    topHolders: Array<{
      ownerAddress: string
      balanceFormatted: number
    }>
  }
  volumeAnalysis: {
    totalVolume: number
    transferCount: number
  }
  liquidityIndicators: {
    exchangeInflows: number
    exchangeOutflows: number
    netFlow: number
  }
}

export interface TradeAnalysisRequest {
  sessionId: string
  tradeSetup: TradeSetup
  riskMetrics: RiskMetrics
  blockchainData?: BlockchainInsights
}

export interface ChatRequest {
  sessionId: string
  question: string
  context?: {
    tradingPair: string
    recommendation: string
    confidence: number
    analysis: string
    riskMetrics: RiskMetrics
    blockchainData?: BlockchainInsights
  }
}

export interface ClaudeResponse {
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID'
  confidence: number
  analysis: string
  keyInsights: string[]
  riskAssessment: string
  blockchainAnalysis: string
  reasoning: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ConversationHistory {
  sessionId: string
  messages: ConversationMessage[]
  context?: any
  lastActivity: number
}

// Trade Outcome Tracking Types
export interface TradeOutcome {
  id: string
  sessionId: string
  timestamp: number
  
  originalAnalysis: ClaudeResponse & {
    tradingPair: string
  }
  
  tradeSetup: TradeSetup
  
  actualEntry: number | null
  actualExit: number | null
  actualPnL: number | null
  actualPnLPercentage: number | null
  timeHeld: number | null
  
  status: 'planned' | 'entered' | 'exited' | 'cancelled'
  exitReason: 'take_profit' | 'stop_loss' | 'manual' | 'time_based' | null
  
  userNotes: string
  entryNotes: string
  exitNotes: string
  
  aiAccuracy: {
    directionCorrect: boolean | null
    confidenceJustified: boolean | null
    riskAssessmentAccurate: boolean | null
  }
  
  metrics: {
    actualRiskRewardRatio: number | null
    holdingPeriodReturn: number | null
    maxDrawdownDuringTrade: number | null
    maxProfitDuringTrade: number | null
  }
}

export interface TradeOutcomeRequest {
  tradeOutcomeId: string
  updates: Partial<TradeOutcome>
}

export interface TradePerformanceMetrics {
  totalTrades: number
  completedTrades: number
  winningTrades: number
  losingTrades: number
  
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  expectancy: number
  
  largestWin: number
  largestLoss: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  maxDrawdown: number
  
  aiAccuracyRate: number
  avgConfidenceVsOutcome: number
  
  avgHoldingPeriod: number
  bestTimeFrame: string
  
  totalPnL: number
  totalPnLPercentage: number
  monthlyReturns: Array<{
    month: string
    pnl: number
    trades: number
  }>
}