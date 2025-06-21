import type { 
  TradeOutcome, 
  TradePerformanceMetrics, 
  TradeAnalyticsFilters,
  TradeJournalEntry
} from '../types/tradeOutcome'
import type { TradeAnalysis } from '../utils/tradeAnalysis'

const STORAGE_KEY = 'traders_mastery_trade_outcomes'
const JOURNAL_STORAGE_KEY = 'traders_mastery_trade_journal'

export class TradeOutcomeService {
  private outcomes: TradeOutcome[] = []
  private journalEntries: TradeJournalEntry[] = []

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Create a new trade outcome record from analysis
   */
  createTradeOutcome(
    analysis: TradeAnalysis,
    tradeSetup: {
      tradingPair: string
      entryPrice: number
      takeProfitPrice: number
      stopLossPrice: number
      positionSize: number
      leverage: number
      timeFrame: string
    },
    sessionId: string
  ): TradeOutcome {
    const outcome: TradeOutcome = {
      id: this.generateId(),
      sessionId,
      timestamp: Date.now(),
      
      originalAnalysis: {
        tradingPair: tradeSetup.tradingPair,
        recommendation: analysis.recommendation as 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID',
        confidence: analysis.confidence,
        analysis: analysis.analysis,
        keyInsights: analysis.keyPoints,
        riskAssessment: analysis.aiInsights?.riskAssessment || 'No risk assessment available',
        blockchainAnalysis: analysis.aiInsights?.blockchainAnalysis || 'No blockchain analysis available',
        reasoning: analysis.aiInsights?.reasoning || 'No reasoning available'
      },
      
      tradeSetup: {
        entryPrice: tradeSetup.entryPrice,
        takeProfitPrice: tradeSetup.takeProfitPrice,
        stopLossPrice: tradeSetup.stopLossPrice,
        positionSize: tradeSetup.positionSize,
        leverage: tradeSetup.leverage,
        timeFrame: tradeSetup.timeFrame
      },
      
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
    this.saveToStorage()
    
    // Add initial journal entry
    this.addJournalEntry(outcome.id, 'analysis', `AI Analysis completed for ${tradeSetup.tradingPair}. Recommendation: ${analysis.recommendation} (${analysis.confidence}% confidence)`, tradeSetup.entryPrice)
    
    return outcome
  }

  /**
   * Update trade outcome with actual execution data
   */
  updateTradeOutcome(id: string, updates: Partial<TradeOutcome>): TradeOutcome | null {
    const index = this.outcomes.findIndex(outcome => outcome.id === id)
    if (index === -1) return null

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
    }

    if (updates.timeHeld) {
      updatedOutcome.timeHeld = updates.timeHeld
    }

    this.outcomes[index] = updatedOutcome
    this.saveToStorage()
    
    return updatedOutcome
  }

  /**
   * Record trade entry
   */
  recordTradeEntry(id: string, actualEntry: number, entryNotes: string = ''): boolean {
    const outcome = this.updateTradeOutcome(id, {
      actualEntry,
      entryNotes,
      status: 'entered'
    })
    
    if (outcome) {
      this.addJournalEntry(id, 'entry', `Trade entered at $${actualEntry}. ${entryNotes}`, actualEntry, 'confident')
      return true
    }
    return false
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
    const outcome = this.outcomes.find(o => o.id === id)
    if (!outcome || !outcome.actualEntry) return false

    const timeHeld = Date.now() - outcome.timestamp
    
    const updated = this.updateTradeOutcome(id, {
      actualExit,
      exitReason,
      exitNotes,
      status: 'exited',
      timeHeld
    })
    
    if (updated) {
      const pnlEmoji = (updated.actualPnL || 0) >= 0 ? '🟢' : '🔴'
      this.addJournalEntry(
        id, 
        'exit', 
        `${pnlEmoji} Trade exited at $${actualExit} (${exitReason}). PnL: ${updated.actualPnLPercentage?.toFixed(2)}%. ${exitNotes}`, 
        actualExit,
        (updated.actualPnL || 0) >= 0 ? 'confident' : 'uncertain'
      )
      return true
    }
    return false
  }

  /**
   * Get all trade outcomes with optional filtering
   */
  getTradeOutcomes(filters?: Partial<TradeAnalyticsFilters>): TradeOutcome[] {
    let filtered = [...this.outcomes]

    if (filters) {
      if (filters.dateRange) {
        filtered = filtered.filter(outcome => 
          outcome.timestamp >= filters.dateRange!.start.getTime() &&
          outcome.timestamp <= filters.dateRange!.end.getTime()
        )
      }

      if (filters.tradingPairs?.length) {
        filtered = filtered.filter(outcome => 
          filters.tradingPairs!.includes(outcome.originalAnalysis.tradingPair)
        )
      }

      if (filters.recommendations?.length) {
        filtered = filtered.filter(outcome => 
          filters.recommendations!.includes(outcome.originalAnalysis.recommendation)
        )
      }

      if (filters.status?.length) {
        filtered = filtered.filter(outcome => 
          filters.status!.includes(outcome.status)
        )
      }

      if (filters.minConfidence !== undefined) {
        filtered = filtered.filter(outcome => 
          outcome.originalAnalysis.confidence >= filters.minConfidence!
        )
      }

      if (filters.maxConfidence !== undefined) {
        filtered = filtered.filter(outcome => 
          outcome.originalAnalysis.confidence <= filters.maxConfidence!
        )
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Calculate comprehensive performance metrics
   */
  getPerformanceMetrics(filters?: Partial<TradeAnalyticsFilters>): TradePerformanceMetrics {
    const outcomes = this.getTradeOutcomes(filters)
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
   * Add journal entry
   */
  addJournalEntry(
    tradeOutcomeId: string, 
    entryType: TradeJournalEntry['entryType'], 
    content: string, 
    priceAtTime: number,
    emotion: TradeJournalEntry['emotion'] = 'neutral',
    tags: string[] = []
  ): void {
    const entry: TradeJournalEntry = {
      id: this.generateId(),
      tradeOutcomeId,
      timestamp: Date.now(),
      entryType,
      content,
      priceAtTime,
      emotion,
      tags
    }

    this.journalEntries.push(entry)
    this.saveJournalToStorage()
  }

  /**
   * Get journal entries for a trade
   */
  getJournalEntries(tradeOutcomeId: string): TradeJournalEntry[] {
    return this.journalEntries
      .filter(entry => entry.tradeOutcomeId === tradeOutcomeId)
      .sort((a, b) => a.timestamp - b.timestamp)
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
    
    // Confidence justified if high confidence (>70%) led to profitable trade or low confidence avoided loss
    const confidenceJustified = outcome.originalAnalysis.confidence > 70 ? 
      pnlPercentage > 0 : 
      Math.abs(pnlPercentage) < 5 // Small loss/gain for low confidence is okay
    
    return {
      directionCorrect,
      confidenceJustified,
      riskAssessmentAccurate: Math.abs(pnlPercentage) < 20 // Risk was controlled
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

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.outcomes = JSON.parse(stored)
      }

      const journalStored = localStorage.getItem(JOURNAL_STORAGE_KEY)
      if (journalStored) {
        this.journalEntries = JSON.parse(journalStored)
      }
    } catch (error) {
      console.error('Failed to load trade outcomes from storage:', error)
      this.outcomes = []
      this.journalEntries = []
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.outcomes))
    } catch (error) {
      console.error('Failed to save trade outcomes to storage:', error)
    }
  }

  private saveJournalToStorage(): void {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(this.journalEntries))
    } catch (error) {
      console.error('Failed to save journal entries to storage:', error)
    }
  }
}

export const tradeOutcomeService = new TradeOutcomeService()