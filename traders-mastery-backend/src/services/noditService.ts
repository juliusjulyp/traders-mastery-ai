import type { BlockchainInsights } from '../types'

// Type interfaces for MCP integration
interface TokenHolder {
  ownerAddress: string
  balance: string
  balanceFormatted?: string
}

interface TokenTransfer {
  from: string
  to: string
  value: string
  valueFormatted?: string
  timestamp?: string
  blockTimestamp?: string
  blockNumber?: number
  transactionHash?: string
}

interface LargeTransfer {
  amount: number
  direction: 'in' | 'out'
  timestamp: number
}

// Global MCP type declaration
declare global {
  var mcp__nodit_mcp_server__call_nodit_api: ((params: {
    protocol: string
    network: string
    operationId: string
    requestBody: any
  }) => Promise<any>) | undefined
}

interface NoditWhaleHolder {
  ownerAddress: string
  balance: string
}

interface NoditTokenTransfer {
  from: string
  to: string
  value: string
  timestamp: number
  blockNumber: number
  transactionHash: string
}

interface NoditTokenPrice {
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

class NoditService {
  constructor() {
    console.log('🔗 [Nodit MCP] Service initialized for pure MCP blockchain data integration')
  }

  /**
   * Get comprehensive blockchain insights for a trading pair
   */
  async getBlockchainInsights(
    tradingPair: string,
    protocol: string = 'ethereum',
    network: string = 'mainnet'
  ): Promise<BlockchainInsights | null> {
    try {
      console.log(`🔍 [Nodit] Fetching blockchain insights for ${tradingPair}`)
      
      // Extract token symbol from trading pair (e.g., "BTC/USDT" -> "BTC")
      const tokenSymbol = tradingPair.split('/')[0].toUpperCase()
      
      // Search for token contract by symbol
      const contractAddress = await this.findTokenContract(tokenSymbol, protocol, network)
      if (!contractAddress) {
        console.warn(`⚠️ [Nodit] Token contract not found for ${tokenSymbol}`)
        return null
      }

      console.log(`📍 [Nodit] Found contract for ${tokenSymbol}: ${contractAddress}`)

      // Gather comprehensive blockchain data in parallel
      const [whaleData, volumeData, priceData] = await Promise.all([
        this.getWhaleActivity(contractAddress, protocol, network),
        this.getVolumeAnalysis(contractAddress, protocol, network),
        this.getPriceData(contractAddress, protocol, network)
      ])

      // Transform Nodit data into our BlockchainInsights format
      const insights: BlockchainInsights = {
        whaleActivity: {
          whaleAccumulation: whaleData.isAccumulating,
          whaleDistribution: whaleData.isDistributing,
          recentLargeTransfers: whaleData.largeTransfers,
          topHolders: whaleData.topHolders
        },
        volumeAnalysis: {
          totalVolume: volumeData.totalVolume,
          transferCount: volumeData.transferCount
        },
        liquidityIndicators: {
          exchangeInflows: volumeData.exchangeInflows,
          exchangeOutflows: volumeData.exchangeOutflows,
          netFlow: volumeData.netFlow
        }
      }

      console.log(`✅ [Nodit] Blockchain insights gathered for ${tokenSymbol}`)
      return insights

    } catch (error) {
      console.error('❌ [Nodit] Failed to fetch blockchain insights:', error)
      return null
    }
  }

  /**
   * Search for token contract address by symbol using real Nodit API
   */
  private async findTokenContract(
    symbol: string,
    protocol: string,
    network: string
  ): Promise<string | null> {
    try {
      // First try known contracts for faster lookup
      const knownContracts: Record<string, string> = {
        'BTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
      }

      const contractAddress = knownContracts[symbol]
      if (contractAddress) {
        console.log(`📍 [Nodit] Using known contract for ${symbol}: ${contractAddress}`)
        return contractAddress
      }

      // Use MCP Nodit API to search for contract
      console.log(`🔍 [Nodit] Searching for ${symbol} contract using MCP API...`)
      const response = await this.callNoditMCP(
        'searchTokenContractMetadataByKeyword',
        protocol,
        network,
        { keyword: symbol }
      )

      if (response && response.items && response.items.length > 0) {
        const contract = response.items[0]
        console.log(`✅ [Nodit] Found contract for ${symbol}: ${contract.contractAddress}`)
        return contract.contractAddress
      }

      console.warn(`⚠️ [Nodit] No contract found for symbol: ${symbol}`)
      return null

    } catch (error) {
      console.error(`❌ [Nodit] Error searching for ${symbol} contract:`, error)
      // Fallback to known contracts if API fails
      const knownContracts: Record<string, string> = {
        'BTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      }
      return knownContracts[symbol] || null
    }
  }

  /**
   * Analyze whale activity patterns using real Nodit API
   */
  private async getWhaleActivity(
    contractAddress: string,
    protocol: string,
    network: string
  ) {
    try {
      console.log(`🐋 [Nodit] Analyzing whale activity for ${contractAddress}`)

      // Get real token holders data from Nodit via MCP
      const holdersResponse = await this.callNoditMCP(
        'getTokenHoldersByContract',
        protocol,
        network,
        { 
          contractAddress,
          rpp: 100 // Get top 100 holders
        }
      )

      // Get recent token transfers for whale movement analysis
      const transfersResponse = await this.callNoditMCP(
        'getTokenTransfersByContract',
        protocol,
        network,
        { 
          contractAddress,
          rpp: 200 // Get recent 200 transfers
        }
      )

      const holders = holdersResponse?.items || []
      const transfers = transfersResponse?.items || []

      // Analyze whale patterns based on real data
      const whaleThreshold = 1000000 // 1M tokens threshold for whale classification
      const whaleHolders = holders.filter((h: TokenHolder) => {
        const balance = parseFloat(h.balanceFormatted || h.balance || '0')
        return balance > whaleThreshold
      })
      
      // Analyze large transfers from real data
      const largeTransfers = transfers
        .filter((t: TokenTransfer) => {
          const amount = parseFloat(t.valueFormatted || t.value || '0')
          return amount > whaleThreshold / 10 // Large transfers (100k+ tokens)
        })
        .slice(0, 20) // Most recent 20 large transfers
        .map((t: TokenTransfer) => {
          // Determine if this is accumulation (buying) or distribution (selling)
          // This is a simplified heuristic - in practice, you'd want more sophisticated analysis
          const amount = parseFloat(t.valueFormatted || t.value || '0')
          const isToExchange = this.isExchangeAddress(t.to)
          const isFromExchange = this.isExchangeAddress(t.from)
          
          let direction: 'in' | 'out'
          if (isFromExchange && !isToExchange) {
            direction = 'in' // From exchange to wallet = accumulation
          } else if (!isFromExchange && isToExchange) {
            direction = 'out' // From wallet to exchange = distribution
          } else {
            direction = Math.random() > 0.5 ? 'in' : 'out' // Fallback for unclear cases
          }

          return {
            amount,
            direction,
            timestamp: parseInt(t.timestamp || t.blockTimestamp || Date.now().toString())
          }
        })

      const accumulationTransfers = largeTransfers.filter((t: LargeTransfer) => t.direction === 'in').length
      const distributionTransfers = largeTransfers.filter((t: LargeTransfer) => t.direction === 'out').length
      const isAccumulating = accumulationTransfers > distributionTransfers

      return {
        isAccumulating,
        isDistributing: !isAccumulating,
        largeTransfers: largeTransfers.slice(0, 5), // Recent 5 large transfers
        topHolders: whaleHolders.slice(0, 10).map((h: TokenHolder) => ({
          ownerAddress: h.ownerAddress,
          balanceFormatted: parseFloat(h.balanceFormatted || h.balance || '0')
        }))
      }

    } catch (error) {
      console.error('❌ [Nodit] Whale activity analysis failed:', error)
      return {
        isAccumulating: false,
        isDistributing: false,
        largeTransfers: [],
        topHolders: []
      }
    }
  }

  /**
   * Analyze volume and liquidity metrics using real Nodit API
   */
  private async getVolumeAnalysis(
    contractAddress: string,
    protocol: string,
    network: string
  ) {
    try {
      console.log(`📊 [Nodit] Analyzing volume for ${contractAddress}`)

      // Get token transfers within the last 24 hours using real API
      const now = Math.floor(Date.now() / 1000)
      const oneDayAgo = now - 86400 // 24 hours in seconds

      const transfersResponse = await this.callNoditMCP(
        'getTokenTransfersWithinRange',
        protocol,
        network,
        { 
          contractAddress,
          startTime: oneDayAgo,
          endTime: now,
          rpp: 1000 // Get up to 1000 recent transfers
        }
      )

      const transfers = transfersResponse?.items || []
      
      // Calculate real volume metrics
      const totalVolume = transfers.reduce((sum: number, t: TokenTransfer) => {
        return sum + parseFloat(t.valueFormatted || t.value || '0')
      }, 0)
      const transferCount = transfers.length

      // Analyze exchange flows using real transfer data
      const exchangeInflows = transfers
        .filter((t: TokenTransfer) => this.isExchangeAddress(t.to))
        .reduce((sum: number, t: TokenTransfer) => sum + parseFloat(t.valueFormatted || t.value || '0'), 0)

      const exchangeOutflows = transfers
        .filter((t: TokenTransfer) => this.isExchangeAddress(t.from))
        .reduce((sum: number, t: TokenTransfer) => sum + parseFloat(t.valueFormatted || t.value || '0'), 0)

      return {
        totalVolume,
        transferCount,
        exchangeInflows,
        exchangeOutflows,
        netFlow: exchangeInflows - exchangeOutflows
      }

    } catch (error) {
      console.error('❌ [Nodit] Volume analysis failed:', error)
      return {
        totalVolume: 0,
        transferCount: 0,
        exchangeInflows: 0,
        exchangeOutflows: 0,
        netFlow: 0
      }
    }
  }

  /**
   * Check if an address is a known exchange address
   */
  private isExchangeAddress(address: string): boolean {
    const exchangeAddresses = [
      // Centralized exchanges
      '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', // Uniswap
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap Router
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3
      '0xf977814e90da44bfa03b6295a0616a897441acec', // Alameda Research
      '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance
      '0xd551234ae421e3bcba99a0da6d736074f22192ff', // Binance
      '0x564286362092d8e7936f0549571a803b203aced', // Binance
      '0x0681d8db095565fe8a346fa0277bffde9c0edbf', // Kraken
      '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken
      '0x6262998ced04146fa42253a5c0af90ca02dfd2a3', // Coinbase
      '0x503828976d22510aad0201ac7ec88293211d23da', // Coinbase
      '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', // Coinbase
      '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase
      '0xa910f92acdaf488fa6ef02174fb86208ad7722ba', // Coinbase
      '0x9696f59e4d72e237be84ffd425dcad154bf96976'  // Coinbase
    ]

    return exchangeAddresses.includes(address.toLowerCase())
  }

  /**
   * Get current price data using real Nodit API
   */
  private async getPriceData(
    contractAddress: string,
    protocol: string,
    network: string
  ): Promise<NoditTokenPrice | null> {
    try {
      console.log(`💰 [Nodit] Fetching price data for ${contractAddress}`)

      // Get real price data from Nodit MCP API
      const priceResponse = await this.callNoditMCP(
        'getTokenPricesByContracts',
        protocol,
        network,
        { 
          contractAddresses: [contractAddress]
        }
      )

      if (priceResponse?.items && priceResponse.items.length > 0) {
        const priceData = priceResponse.items[0]
        return {
          currency: priceData.currency || 'USD',
          price: priceData.price || '0',
          volumeFor24h: priceData.volumeFor24h || '0',
          percentChangeFor24h: priceData.percentChangeFor24h || '0',
          contract: {
            address: contractAddress,
            name: priceData.contract?.name || 'Unknown Token',
            symbol: priceData.contract?.symbol || 'UNK',
            decimals: priceData.contract?.decimals || 18
          }
        }
      }

      console.warn(`⚠️ [Nodit] No price data found for ${contractAddress}`)
      return null

    } catch (error) {
      console.error('❌ [Nodit] Price data fetch failed:', error)
      return null
    }
  }


  /**
   * Test connection to Nodit services using MCP client
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 [Nodit] Testing service connection...')
      
      // Test the MCP connection
      const result = await this.testMCPConnection()
      
      if (result) {
        console.log('✅ [Nodit] Service connection test passed')
      } else {
        console.warn('⚠️ [Nodit] Service connection test failed')
      }
      
      return result
    } catch (error) {
      console.error('❌ [Nodit] Service connection test failed:', error)
      return false
    }
  }

  /**
   * Make MCP call to Nodit API with HTTP fallback
   */
  private async callNoditMCP(
    operationId: string,
    protocol: string,
    network: string,
    requestBody: any
  ): Promise<any> {
    console.log(`📡 [Nodit MCP] Calling ${operationId} for ${protocol}/${network}`)
    
    // Try MCP first
    if (typeof mcp__nodit_mcp_server__call_nodit_api === 'function') {
      try {
        // Direct MCP call using available MCP tools
        return await mcp__nodit_mcp_server__call_nodit_api({
          protocol,
          network,
          operationId,
          requestBody
        })
      } catch (mcpError) {
        console.warn(`⚠️ [Nodit MCP] MCP call failed, trying HTTP fallback:`, mcpError)
      }
    } else {
      console.log(`⚠️ [Nodit MCP] MCP tools not available, using HTTP fallback`)
    }
    
    // HTTP fallback - always try this if MCP fails or isn't available
    try {
      return await this.callNoditHTTP(operationId, protocol, network, requestBody)
    } catch (error) {
      console.error(`❌ [Nodit] Call failed for ${operationId}:`, error)
      throw error
    }
  }

  /**
   * HTTP fallback to Nodit API
   */
  private async callNoditHTTP(
    operationId: string,
    protocol: string,
    network: string,
    requestBody: any
  ): Promise<any> {
    const https = require('https')
    
    const API_KEY = process.env.NODIT_API_KEY
    if (!API_KEY) {
      throw new Error('NODIT_API_KEY environment variable not set')
    }

    const baseUrl = 'https://web3.nodit.io/v1'
    
    // Map operation IDs to their correct API paths
    const pathMappings: Record<string, string> = {
      'getTokenHoldersByContract': 'token/getTokenHoldersByContract',
      'getTokenTransfersByContract': 'token/getTokenTransfersByContract',
      'getTokenTransfersWithinRange': 'token/getTokenTransfersWithinRange',
      'getTokenPricesByContracts': 'token/getTokenPricesByContracts',
      'searchTokenContractMetadataByKeyword': 'token/searchTokenContractMetadataByKeyword'
    }
    
    const apiPath = pathMappings[operationId] || operationId
    const url = `${baseUrl}/${protocol}/${network}/${apiPath}`

    console.log(`🌐 [HTTP Fallback] Calling ${url}`)

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody)
      
      const options = {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      const req = https.request(url, options, (res: any) => {
        let responseBody = ''
        
        res.on('data', (chunk: any) => {
          responseBody += chunk
        })
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody)
            if (res.statusCode === 200) {
              console.log(`✅ [HTTP Fallback] Success for ${operationId}`)
              resolve(parsed)
            } else {
              console.error(`❌ [HTTP Fallback] HTTP ${res.statusCode}:`, parsed)
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`))
            }
          } catch (parseError) {
            console.error(`❌ [HTTP Fallback] Parse error:`, responseBody)
            reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`))
          }
        })
      })

      req.on('error', (error: any) => {
        console.error(`❌ [HTTP Fallback] Request error:`, error)
        reject(error)
      })

      req.write(postData)
      req.end()
    })
  }


  /**
   * Test MCP connection
   */
  private async testMCPConnection(): Promise<boolean> {
    try {
      const result = await this.callNoditMCP(
        'getTokenHoldersByContract',
        'ethereum',
        'mainnet',
        { contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', rpp: 1 }
      )
      
      return result && result.items && result.items.length > 0
    } catch (error) {
      console.error('❌ [Nodit MCP] Connection test failed:', error)
      return false
    }
  }

  /**
   * Get supported protocols and networks
   */
  getSupportedProtocols(): string[] {
    return ['ethereum', 'polygon', 'arbitrum', 'base', 'optimism']
  }

  getSupportedNetworks(): Record<string, string[]> {
    return {
      ethereum: ['mainnet', 'sepolia'],
      polygon: ['mainnet', 'amoy'],
      arbitrum: ['mainnet', 'sepolia'],
      base: ['mainnet', 'sepolia'],
      optimism: ['mainnet', 'sepolia']
    }
  }
}

export const noditService = new NoditService()