// Blockchain Types - Centralized type definitions

export interface WhaleHolder {
  ownerAddress: string
  balanceFormatted: number
  percentageOfSupply: number
}

export interface TokenTransfer {
  fromAddress: string
  toAddress: string
  amountFormatted: number
  blockHeight: number
  transactionHash: string
  timestamp: number
}

export interface VolumeAnalysis {
  totalVolume: number
  transferCount: number
  averageTransferSize: number
  last24Hours: number
}

export interface LiquidityIndicators {
  exchangeInflows: number
  exchangeOutflows: number
  netFlow: number
  majorExchanges: string[]
}

export interface WhaleActivity {
  topHolders: WhaleHolder[]
  recentLargeTransfers: TokenTransfer[]
  whaleAccumulation: boolean
  whaleDistribution: boolean
  concentrationScore: number
}

export interface BlockchainInsights {
  symbol: string
  contractAddress: string
  whaleActivity: WhaleActivity
  volumeAnalysis: VolumeAnalysis
  liquidityIndicators: LiquidityIndicators
  lastUpdated: number
}

// Strategy Pattern Interface
export interface BlockchainDataProvider {
  getBlockchainInsights(tradingPair: string): Promise<BlockchainInsights>
  getWhaleHolders(contractAddress: string): Promise<WhaleHolder[]>
  getTokenTransfers(contractAddress: string): Promise<TokenTransfer[]>
}

// Provider Configuration
export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  timeout?: number
  useMockData?: boolean
}