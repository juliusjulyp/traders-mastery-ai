// Backend API service for Claude integration
const API_BASE_URL = 'http://localhost:3001/api'

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

export interface TokenPrice {
  currency: string
  price: string
  volumeFor24h: string
  percentChangeFor24h: string
  contract: {
    address: string
    name: string
    symbol: string
    decimals: number
  }
}

export interface TokenPriceRequest {
  symbol?: string
  contractAddress?: string
  protocol?: string
  network?: string
}

export interface BatchTokenPricesRequest {
  tokens: Array<{
    symbol?: string
    contractAddress?: string
  }>
  protocol?: string
  network?: string
}

class BackendApiService {
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async analyzeTradeSetup(
    tradeSetup: TradeSetup,
    riskMetrics: RiskMetrics,
    blockchainData?: BlockchainInsights
  ): Promise<ClaudeResponse> {
    const request: TradeAnalysisRequest = {
      sessionId: this.sessionId,
      tradeSetup,
      riskMetrics,
      blockchainData
    }

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Backend API Error (Trade Analysis):', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze trade setup')
    }
  }

  async chatWithAI(
    question: string,
    context?: ChatRequest['context']
  ): Promise<string> {
    const request: ChatRequest = {
      sessionId: this.sessionId,
      question,
      context
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data.response
    } catch (error) {
      console.error('Backend API Error (Chat):', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response')
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return response.ok
    } catch (error) {
      console.error('Backend health check failed:', error)
      return false
    }
  }

  async getBlockchainInsights(
    tradingPair: string,
    protocol?: string,
    network: string = 'mainnet'
  ): Promise<BlockchainInsights | null> {
    try {
      console.log(`🐛 [DEBUG] Fetching blockchain insights for ${tradingPair}`)
      
      const response = await fetch(`${API_BASE_URL}/blockchain-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          tradingPair, 
          ...(protocol && { protocol }), 
          network 
        })
      })

      console.log(`🐛 [DEBUG] Response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🐛 [DEBUG] API Error:', errorData)
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('🐛 [DEBUG] API Response:', result)
      console.log('🐛 [DEBUG] Whale holders count:', result.data?.whaleActivity?.topHolders?.length)
      
      return result.data
    } catch (error) {
      console.error('Backend API Error (Blockchain Insights):', error)
      return null
    }
  }

  async getNoditStatus(): Promise<{ status: string; timestamp?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/nodit-status`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Nodit status check failed:', error)
      return { status: 'error', message: 'Failed to connect to Nodit service' }
    }
  }

  async getTokenPrice(request: TokenPriceRequest): Promise<TokenPrice | null> {
    try {
      console.log(`💰 [FRONTEND] Fetching token price for:`, request)
      
      const response = await fetch(`${API_BASE_URL}/token-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: request.symbol,
          contractAddress: request.contractAddress,
          protocol: request.protocol || 'ethereum',
          network: request.network || 'mainnet'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Token price API error:', errorData)
        return null
      }

      const result = await response.json()
      if (result.success && result.data) {
        console.log(`✅ [FRONTEND] Token price retrieved: $${result.data.price}`)
        return result.data
      }
      
      console.warn('No token price data returned')
      return null
    } catch (error) {
      console.error('Frontend API Error (Token Price):', error)
      return null
    }
  }

  async getBatchTokenPrices(request: BatchTokenPricesRequest): Promise<TokenPrice[]> {
    try {
      console.log(`💰 [FRONTEND] Fetching batch token prices for ${request.tokens.length} tokens`)
      
      const response = await fetch(`${API_BASE_URL}/token-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokens: request.tokens,
          protocol: request.protocol || 'ethereum',
          network: request.network || 'mainnet'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Batch token prices API error:', errorData)
        return []
      }

      const result = await response.json()
      if (result.success && result.data) {
        console.log(`✅ [FRONTEND] Batch prices retrieved: ${result.data.length} tokens`)
        return result.data
      }
      
      console.warn('No batch token price data returned')
      return []
    } catch (error) {
      console.error('Frontend API Error (Batch Token Prices):', error)
      return []
    }
  }

  async getPopularTokenPrices(): Promise<TokenPrice[]> {
    const popularTokens = [
      { symbol: 'BTC' },
      { symbol: 'ETH' },
      { symbol: 'USDT' },
      { symbol: 'USDC' },
      { symbol: 'LINK' },
      { symbol: 'UNI' },
      { symbol: 'AAVE' }
    ]

    return this.getBatchTokenPrices({
      tokens: popularTokens,
      protocol: 'ethereum',
      network: 'mainnet'
    })
  }

  getSessionId(): string {
    return this.sessionId
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId()
  }
}

export const backendApi = new BackendApiService()