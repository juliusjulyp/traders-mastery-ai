export interface TradeOutcome {
  id: string
  sessionId: string
  timestamp: number
  
  // Original Analysis Data
  originalAnalysis: {
    tradingPair: string
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID'
    confidence: number
    analysis: string
    keyInsights: string[]
    riskAssessment: string
    blockchainAnalysis: string
    reasoning: string
  }
  
  // Trade Setup Data
  tradeSetup: {
    entryPrice: number
    takeProfitPrice: number
    stopLossPrice: number
    positionSize: number
    leverage: number
    timeFrame: string
  }
  
  // Actual Trade Execution
  actualEntry: number | null
  actualExit: number | null
  actualPnL: number | null
  actualPnLPercentage: number | null
  timeHeld: number | null // milliseconds
  
  // Trade Status
  status: 'planned' | 'entered' | 'exited' | 'cancelled'
  exitReason: 'take_profit' | 'stop_loss' | 'manual' | 'time_based' | null
  
  // User Notes
  userNotes: string
  entryNotes: string
  exitNotes: string
  
  // AI Accuracy Tracking
  aiAccuracy: {
    directionCorrect: boolean | null // Did price move in predicted direction
    confidenceJustified: boolean | null // Was the confidence level appropriate
    riskAssessmentAccurate: boolean | null // Was risk properly assessed
  }
  
  // Performance Metrics
  metrics: {
    actualRiskRewardRatio: number | null
    holdingPeriodReturn: number | null
    maxDrawdownDuringTrade: number | null
    maxProfitDuringTrade: number | null
  }
}

export interface TradePerformanceMetrics {
  totalTrades: number
  completedTrades: number
  winningTrades: number
  losingTrades: number
  
  // Performance Ratios
  winRate: number // percentage
  averageWin: number // average profit
  averageLoss: number // average loss
  profitFactor: number // gross profit / gross loss
  expectancy: number // average trade outcome
  
  // Risk Metrics
  largestWin: number
  largestLoss: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  maxDrawdown: number
  
  // AI Performance
  aiAccuracyRate: number // how often AI direction was correct
  avgConfidenceVsOutcome: number // correlation between confidence and success
  
  // Time Analysis
  avgHoldingPeriod: number // average time in trades (milliseconds)
  bestTimeFrame: string // most profitable timeframe
  
  // PnL Analysis
  totalPnL: number
  totalPnLPercentage: number
  monthlyReturns: Array<{
    month: string
    pnl: number
    trades: number
  }>
}

export interface TradeAnalyticsFilters {
  dateRange: {
    start: Date
    end: Date
  }
  tradingPairs: string[]
  timeFrames: string[]
  recommendations: string[]
  status: string[]
  minConfidence: number
  maxConfidence: number
}

export interface TradeOutcomeRequest {
  tradeOutcomeId: string
  updates: Partial<TradeOutcome>
}

export interface TradeJournalEntry {
  id: string
  tradeOutcomeId: string
  timestamp: number
  entryType: 'analysis' | 'entry' | 'exit' | 'note' | 'learning'
  content: string
  priceAtTime: number
  emotion: 'confident' | 'uncertain' | 'fearful' | 'greedy' | 'neutral'
  tags: string[]
}