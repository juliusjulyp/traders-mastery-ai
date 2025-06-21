// Enhanced Whale Intelligence API Service

export interface WhaleHolder {
  address: string
  balance: string
  balanceFormatted: string
  percentage: number
  tier: 'mega' | 'whale' | 'dolphin' | 'fish'
  isExchange?: boolean
  label?: string
}

export interface WhaleTierAnalysis {
  megaWhales: WhaleHolder[]
  whales: WhaleHolder[]
  dolphins: WhaleHolder[]
  totalHolders: number
  concentration: {
    top10Percentage: number
    top50Percentage: number
    giniCoefficient: number
    concentrationRisk: 'Low' | 'Medium' | 'High'
  }
}

export interface WhaleBehaviorPattern {
  recentActivity: 'accumulating' | 'distributing' | 'holding' | 'mixed'
  coordinatedMovements: number
  averageHoldTime: string
  historicalAccuracy: number
  confidenceScore: number
  patterns: {
    buyPressure: number
    sellPressure: number
    hodlStrength: number
  }
}

export interface WhalePrediction {
  priceImpact: {
    direction: 'bullish' | 'bearish' | 'neutral'
    magnitude: 'low' | 'medium' | 'high'
    timeframe: '24h' | '3d' | '7d'
    confidence: number
  }
  recommendation: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT'
    reasoning: string[]
    riskLevel: 'Low' | 'Medium' | 'High'
  }
}

export interface EnhancedWhaleIntelligence {
  tiers: WhaleTierAnalysis
  behavior: WhaleBehaviorPattern
  predictions: WhalePrediction
  lastUpdated: string
}

class EnhancedWhaleApiService {
  private baseUrl = '/api'

  /**
   * Get enhanced whale intelligence for a trading pair
   */
  async getEnhancedWhaleIntelligence(
    tradingPair: string,
    protocol?: string,
    network: string = 'mainnet'
  ): Promise<EnhancedWhaleIntelligence | null> {
    try {
      console.log(`🐋 [Frontend] Fetching enhanced whale intelligence for ${tradingPair}`)
      
      const response = await fetch(`${this.baseUrl}/enhanced-whale-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tradingPair,
          protocol,
          network
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch whale intelligence')
      }

      console.log(`✅ [Frontend] Enhanced whale intelligence received for ${tradingPair}`)
      return data.data
      
    } catch (error) {
      console.error('❌ [Frontend] Enhanced whale intelligence fetch failed:', error)
      return null
    }
  }

  /**
   * Format whale tier for display
   */
  formatWhaleTier(tier: string): { label: string; color: string; icon: string } {
    const tierMap = {
      mega: { label: 'Mega Whale', color: '#ff0066', icon: '🐋' },
      whale: { label: 'Whale', color: '#0066ff', icon: '🐳' },
      dolphin: { label: 'Dolphin', color: '#00cc99', icon: '🐬' },
      fish: { label: 'Fish', color: '#999999', icon: '🐟' }
    }
    
    return tierMap[tier as keyof typeof tierMap] || tierMap.fish
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    if (value >= 1) {
      return `${value.toFixed(1)}%`
    } else if (value >= 0.1) {
      return `${value.toFixed(2)}%`
    } else {
      return `${value.toFixed(3)}%`
    }
  }

  /**
   * Get risk level color
   */
  getRiskLevelColor(risk: string): string {
    const colorMap = {
      'Low': '#00cc66',
      'Medium': '#ffcc00', 
      'High': '#ff3366'
    }
    
    return colorMap[risk as keyof typeof colorMap] || '#999999'
  }

  /**
   * Get activity direction color and icon
   */
  getActivityDisplay(activity: string): { color: string; icon: string; label: string } {
    const activityMap = {
      accumulating: { color: '#00cc66', icon: '📈', label: 'Accumulating' },
      distributing: { color: '#ff3366', icon: '📉', label: 'Distributing' },
      holding: { color: '#ffcc00', icon: '💎', label: 'Holding' },
      mixed: { color: '#999999', icon: '🔄', label: 'Mixed Activity' }
    }
    
    return activityMap[activity as keyof typeof activityMap] || activityMap.mixed
  }

  /**
   * Get recommendation action styling
   */
  getRecommendationStyle(action: string): { color: string; background: string; icon: string } {
    const actionMap = {
      BUY: { color: '#ffffff', background: '#00cc66', icon: '🚀' },
      SELL: { color: '#ffffff', background: '#ff3366', icon: '⚠️' },
      HOLD: { color: '#333333', background: '#ffcc00', icon: '💎' },
      WAIT: { color: '#666666', background: '#e0e0e0', icon: '⏳' }
    }
    
    return actionMap[action as keyof typeof actionMap] || actionMap.WAIT
  }
}

export const enhancedWhaleApi = new EnhancedWhaleApiService()