import type { 
  TradeOutcome, 
  TradePerformanceMetrics, 
  ClaudeResponse, 
  TradeSetup 
} from '../types'

class TradeTrackingService {
  private outcomes: TradeOutcome[] = []

  /**
   * Create a new trade outcome record when analysis is completed
   */
  createTradeOutcome(
    sessionId: string,
    analysis: ClaudeResponse,
    tradeSetup: TradeSetup
  ): TradeOutcome {
    const outcome: TradeOutcome = {
      id: this.generateId(),
      sessionId,
      timestamp: Date.now(),
      
      originalAnalysis: {
        ...analysis,
        tradingPair: tradeSetup.tradingPair
      },
      
      tradeSetup,
      
      actualEntry: null,
      actualExit: null,
      actualPnL: null,
      actualPnLPercentage: null,
      timeHeld: null,
      
      status: 'planned',
      exitReason: null,
      
      userNotes: '',
      entryNotes: '',
      exitNotes: '',
      
      aiAccuracy: {
        directionCorrect: null,
        confidenceJustified: null,
        riskAssessmentAccurate: null
      },
      
      metrics: {
        actualRiskRewardRatio: null,
        holdingPeriodReturn: null,
        maxDrawdownDuringTrade: null,
        maxProfitDuringTrade: null
      }
    }

    this.outcomes.push(outcome)
    console.log(`📊 [Trade Tracking] Created outcome record for ${tradeSetup.tradingPair} (ID: ${outcome.id})`)
    
    return outcome
  }

  /**
   * Update existing trade outcome
   */
  updateTradeOutcome(id: string, updates: Partial<TradeOutcome>): TradeOutcome | null {
    const index = this.outcomes.findIndex(outcome => outcome.id === id)
    if (index === -1) {
      console.warn(`⚠️ [Trade Tracking] Trade outcome not found: ${id}`)
      return null
    }

    const outcome = this.outcomes[index]
    const updatedOutcome = { ...outcome, ...updates }

    // Auto-calculate metrics when trade is completed
    if (updates.actualEntry && updates.actualExit && updates.status === 'exited') {
      updatedOutcome.actualPnL = this.calculatePnL(
        updates.actualEntry,
        updates.actualExit,
        outcome.tradeSetup.positionSize,
        outcome.tradeSetup.leverage
      )
      
      updatedOutcome.actualPnLPercentage = this.calculatePnLPercentage(
        updates.actualEntry,
        updates.actualExit,
        outcome.tradeSetup.leverage
      )

      updatedOutcome.metrics = {
        ...updatedOutcome.metrics,
        actualRiskRewardRatio: this.calculateActualRiskReward(outcome, updates.actualEntry, updates.actualExit),
        holdingPeriodReturn: updatedOutcome.actualPnLPercentage
      }

      // Calculate AI accuracy
      updatedOutcome.aiAccuracy = this.calculateAIAccuracy(outcome, updates.actualEntry, updates.actualExit)
      
      console.log(`📊 [Trade Tracking] Trade completed: ${updatedOutcome.originalAnalysis.tradingPair} - PnL: ${updatedOutcome.actualPnLPercentage?.toFixed(2)}%`)
    }

    this.outcomes[index] = updatedOutcome
    return updatedOutcome
  }

  /**
   * Get trade outcome by ID
   */
  getTradeOutcome(id: string): TradeOutcome | null {
    return this.outcomes.find(outcome => outcome.id === id) || null
  }

  /**
   * Get all trade outcomes for a session
   */
  getTradeOutcomesBySession(sessionId: string): TradeOutcome[] {
    return this.outcomes
      .filter(outcome => outcome.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get all trade outcomes with optional filtering
   */
  getAllTradeOutcomes(filters?: {
    startDate?: number
    endDate?: number
    tradingPairs?: string[]
    status?: string[]
  }): TradeOutcome[] {
    let filtered = [...this.outcomes]

    if (filters) {
      if (filters.startDate) {
        filtered = filtered.filter(outcome => outcome.timestamp >= filters.startDate!)
      }

      if (filters.endDate) {
        filtered = filtered.filter(outcome => outcome.timestamp <= filters.endDate!)
      }

      if (filters.tradingPairs?.length) {
        filtered = filtered.filter(outcome => 
          filters.tradingPairs!.includes(outcome.originalAnalysis.tradingPair)
        )
      }

      if (filters.status?.length) {
        filtered = filtered.filter(outcome => 
          filters.status!.includes(outcome.status)
        )
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Calculate comprehensive performance metrics
   */
  getPerformanceMetrics(sessionId?: string): TradePerformanceMetrics {
    const outcomes = sessionId ? 
      this.getTradeOutcomesBySession(sessionId) : 
      this.getAllTradeOutcomes()
      
    const completedTrades = outcomes.filter(o => o.status === 'exited' && o.actualPnL !== null)
    const winningTrades = completedTrades.filter(o => (o.actualPnL || 0) > 0)
    const losingTrades = completedTrades.filter(o => (o.actualPnL || 0) < 0)

    const totalPnL = completedTrades.reduce((sum, trade) => sum + (trade.actualPnL || 0), 0)
    const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.actualPnL || 0), 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.actualPnL || 0), 0))

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0

    // AI Accuracy calculation
    const aiAnalyzedTrades = completedTrades.filter(t => t.aiAccuracy.directionCorrect !== null)
    const correctDirections = aiAnalyzedTrades.filter(t => t.aiAccuracy.directionCorrect === true)

    return {
      totalTrades: outcomes.length,
      completedTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      
      winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
      averageWin: avgWin,
      averageLoss: avgLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      expectancy: completedTrades.length > 0 ? totalPnL / completedTrades.length : 0,
      
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.actualPnL || 0)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.actualPnL || 0)) : 0,
      maxConsecutiveWins: this.calculateMaxConsecutive(completedTrades, true),
      maxConsecutiveLosses: this.calculateMaxConsecutive(completedTrades, false),
      maxDrawdown: this.calculateMaxDrawdown(completedTrades),
      
      aiAccuracyRate: aiAnalyzedTrades.length > 0 ? (correctDirections.length / aiAnalyzedTrades.length) * 100 : 0,
      avgConfidenceVsOutcome: this.calculateConfidenceCorrelation(completedTrades),
      
      avgHoldingPeriod: this.calculateAvgHoldingPeriod(completedTrades),
      bestTimeFrame: this.findBestTimeFrame(completedTrades),
      
      totalPnL,
      totalPnLPercentage: this.calculateTotalPnLPercentage(completedTrades),
      monthlyReturns: this.calculateMonthlyReturns(completedTrades)
    }
  }

  /**
   * Record trade entry
   */
  recordTradeEntry(id: string, actualEntry: number, entryNotes: string = ''): boolean {
    const updated = this.updateTradeOutcome(id, {
      actualEntry,
      entryNotes,
      status: 'entered'
    })
    
    return updated !== null
  }

  /**
   * Record trade exit
   */
  recordTradeExit(
    id: string, 
    actualExit: number, 
    exitReason: TradeOutcome['exitReason'],
    exitNotes: string = ''
  ): boolean {
    const outcome = this.getTradeOutcome(id)
    if (!outcome || !outcome.actualEntry) return false

    const timeHeld = Date.now() - outcome.timestamp
    
    const updated = this.updateTradeOutcome(id, {
      actualExit,
      exitReason,
      exitNotes,
      status: 'exited',
      timeHeld
    })
    
    return updated !== null
  }

  // Private helper methods
  private generateId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private calculatePnL(entry: number, exit: number, positionSize: number, leverage: number): number {
    const priceChange = exit - entry
    const percentChange = priceChange / entry
    return positionSize * percentChange * leverage
  }

  private calculatePnLPercentage(entry: number, exit: number, leverage: number): number {
    const priceChange = exit - entry
    const percentChange = (priceChange / entry) * 100
    return percentChange * leverage
  }

  private calculateActualRiskReward(outcome: TradeOutcome, actualEntry: number, actualExit: number): number {
    const profit = actualExit - actualEntry
    const plannedRisk = Math.abs(outcome.tradeSetup.entryPrice - outcome.tradeSetup.stopLossPrice)
    
    if (plannedRisk === 0) return 0
    return Math.abs(profit / plannedRisk)
  }

  private calculateAIAccuracy(outcome: TradeOutcome, actualEntry: number, actualExit: number): TradeOutcome['aiAccuracy'] {
    const predicted = outcome.originalAnalysis.recommendation
    const actualDirection = actualExit > actualEntry ? 'bullish' : 'bearish'
    const predictedDirection = ['STRONG_BUY', 'BUY'].includes(predicted) ? 'bullish' : 'bearish'
    
    const directionCorrect = actualDirection === predictedDirection
    const pnlPercentage = this.calculatePnLPercentage(actualEntry, actualExit, outcome.tradeSetup.leverage)
    
    const confidenceJustified = outcome.originalAnalysis.confidence > 70 ? 
      pnlPercentage > 0 : 
      Math.abs(pnlPercentage) < 5
    
    return {
      directionCorrect,
      confidenceJustified,
      riskAssessmentAccurate: Math.abs(pnlPercentage) < 20
    }
  }

  private calculateMaxConsecutive(trades: TradeOutcome[], wins: boolean): number {
    let maxConsecutive = 0
    let currentConsecutive = 0
    
    for (const trade of trades) {
      const isWin = (trade.actualPnL || 0) > 0
      if (isWin === wins) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 0
      }
    }
    
    return maxConsecutive
  }

  private calculateMaxDrawdown(trades: TradeOutcome[]): number {
    let runningBalance = 0
    let peak = 0
    let maxDrawdown = 0
    
    for (const trade of trades) {
      runningBalance += trade.actualPnL || 0
      peak = Math.max(peak, runningBalance)
      const drawdown = peak - runningBalance
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
    
    return maxDrawdown
  }

  private calculateConfidenceCorrelation(trades: TradeOutcome[]): number {
    if (trades.length === 0) return 0
    
    const correlations = trades.map(trade => {
      const success = (trade.actualPnL || 0) > 0 ? 1 : 0
      const confidence = trade.originalAnalysis.confidence / 100
      return success * confidence
    })
    
    return correlations.reduce((sum, corr) => sum + corr, 0) / trades.length * 100
  }

  private calculateAvgHoldingPeriod(trades: TradeOutcome[]): number {
    const tradesWithTime = trades.filter(t => t.timeHeld !== null)
    if (tradesWithTime.length === 0) return 0
    
    const totalTime = tradesWithTime.reduce((sum, trade) => sum + (trade.timeHeld || 0), 0)
    return totalTime / tradesWithTime.length
  }

  private findBestTimeFrame(trades: TradeOutcome[]): string {
    const timeFramePerformance: Record<string, number> = {}
    
    for (const trade of trades) {
      const timeFrame = trade.tradeSetup.timeFrame
      if (!timeFramePerformance[timeFrame]) {
        timeFramePerformance[timeFrame] = 0
      }
      timeFramePerformance[timeFrame] += trade.actualPnL || 0
    }
    
    return Object.entries(timeFramePerformance)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''
  }

  private calculateTotalPnLPercentage(trades: TradeOutcome[]): number {
    return trades.reduce((sum, trade) => sum + (trade.actualPnLPercentage || 0), 0)
  }

  private calculateMonthlyReturns(trades: TradeOutcome[]): Array<{month: string, pnl: number, trades: number}> {
    const monthlyData: Record<string, {pnl: number, trades: number}> = {}
    
    for (const trade of trades) {
      const date = new Date(trade.timestamp)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { pnl: 0, trades: 0 }
      }
      
      monthlyData[monthKey].pnl += trade.actualPnL || 0
      monthlyData[monthKey].trades++
    }
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }
}

export const tradeTrackingService = new TradeTrackingService()