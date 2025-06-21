/**
 * MCP Client Service for Nodit Blockchain Data
 * 
 * This service creates a proper MCP client that connects to the Nodit MCP server
 * and provides structured blockchain data for our trading analysis.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export interface MCPBlockchainResponse {
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

class MCPClientService {
  private client: Client | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  constructor() {
    console.log('🔗 [MCP Client] Service initialized')
  }

  /**
   * Connect to the Nodit MCP server using  MCP SDK
   */
  private async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this._doConnect()
    return this.connectionPromise
  }

  private async _doConnect(): Promise<void> {
    try {
      console.log('🔌 [MCP Client] Connecting to Nodit MCP server...')
      
      // Create transport to communicate with nodit-mcp-server
      const transport = new StdioClientTransport({
        command: 'npx',
        args: ['@noditlabs/nodit-mcp-server'],
        env: {
          ...process.env,
          NODIT_API_KEY: process.env.NODIT_API_KEY || ''
        }
      })

      // Create MCP client
      this.client = new Client({
        name: "traders-mastery-backend",
        version: "1.0.0"
      }, {
        capabilities: {
          tools: {}
        }
      })

      // Connect to the MCP server
      await this.client.connect(transport)
      this.isConnected = true
      
      console.log('✅ [MCP Client] Successfully connected to Nodit MCP server')
      
      // List available tools for debugging
      const tools = await this.client.listTools()
      console.log('🔧 [MCP Client] Available tools:', tools.tools.map(t => t.name))
      
    } catch (error) {
      console.error('❌ [MCP Client] Failed to connect:', error)
      this.isConnected = false
      this.client = null
      this.connectionPromise = null
      throw error
    }
  }

  /**
   * Call Nodit API through MCP
   */
  async callNoditAPI(
    operationId: string,
    protocol: string,
    network: string,
    requestBody: any
  ): Promise<any> {
    await this.connect()
    
    if (!this.client) {
      throw new Error('MCP client not connected')
    }

    try {
      console.log(`📡 [MCP Client] Calling ${operationId} for ${protocol}/${network}`)
      
      const result = await this.client.callTool({
        name: 'call_nodit_api',
        arguments: {
          protocol,
          network,
          operationId,
          requestBody
        }
      })

      console.log(`✅ [MCP Client] Successfully called ${operationId}`)
      
      // Handle different response formats
      if (result && typeof result === 'object') {
        // If result has content array, parse the first text content
        if ((result as any).content && Array.isArray((result as any).content)) {
          const content = (result as any).content[0]
          if (content && content.text) {
            try {
              return JSON.parse(content.text)
            } catch {
              return content.text
            }
          }
        }
        
        // If result has toolResult, return it directly
        if ((result as any).toolResult) {
          return (result as any).toolResult
        }
        
        // Return the result as-is
        return result
      }
      
      return result
      
    } catch (error) {
      console.error(`❌ [MCP Client] Tool call failed for ${operationId}:`, error)
      throw error
    }
  }

  /**
   * Get blockchain insights using MCP
   */
  async getBlockchainInsights(
    tradingPair: string,
    protocol: string,
    network: string = 'mainnet'
  ): Promise<MCPBlockchainResponse | null> {
    try {
      console.log(`🔍 [MCP Client] Fetching blockchain insights for ${tradingPair}`)
      
      // Extract token symbol from trading pair (e.g., "BTC/USDT" -> "BTC")
      const tokenSymbol = tradingPair.split('/')[0].toUpperCase()
      
      // Get contract address (you may want to improve this lookup)
      const contractAddress = this.getKnownContractAddress(tokenSymbol)
      if (!contractAddress) {
        console.warn(`⚠️ [MCP Client] No contract address found for ${tokenSymbol}`)
        return null
      }

      console.log(`📍 [MCP Client] Using contract: ${contractAddress}`)

      // Get blockchain data in parallel using MCP
      const [holdersResponse, transfersResponse] = await Promise.all([
        this.callNoditAPI(
          'getTokenHoldersByContract',
          protocol,
          network,
          { contractAddress, rpp: 100 }
        ),
        this.callNoditAPI(
          'getTokenTransfersByContract',
          protocol,
          network,
          { contractAddress, rpp: 200 }
        )
      ])

      // Process the data (reuse your existing logic)
      const insights = this.processBlockchainData(
        holdersResponse?.items || [],
        transfersResponse?.items || []
      )
      
      console.log(`✅ [MCP Client] Blockchain insights generated for ${tokenSymbol}`)
      return insights

    } catch (error) {
      console.error('❌ [MCP Client] Failed to fetch blockchain insights:', error)
      return null
    }
  }

  /**
   * Process blockchain data into insights format
   * (Reusing logic from your existing noditService)
   */
  private processBlockchainData(holders: any[], transfers: any[]): MCPBlockchainResponse {
    console.log(`🧠 [MCP Client] Processing ${holders.length} holders and ${transfers.length} transfers`)
    
    // Analyze whale activity
    const whaleThreshold = 1000000 // 1M tokens
    const whaleHolders = holders.filter(h => 
      parseFloat(h.balanceFormatted || h.balance || '0') > whaleThreshold
    )
    
    // Analyze large transfers
    const largeTransfers = transfers
      .filter(t => parseFloat(t.valueFormatted || t.value || '0') > whaleThreshold / 10)
      .slice(0, 20)
      .map(t => {
        const amount = parseFloat(t.valueFormatted || t.value || '0')
        const isToExchange = this.isKnownExchange(t.to)
        const isFromExchange = this.isKnownExchange(t.from)
        
        let direction: 'in' | 'out'
        if (isFromExchange && !isToExchange) {
          direction = 'in'  // Exchange to wallet = accumulation
        } else if (!isFromExchange && isToExchange) {
          direction = 'out' // Wallet to exchange = distribution
        } else {
          direction = Math.random() > 0.5 ? 'in' : 'out'
        }
        
        return {
          amount,
          direction,
          timestamp: parseInt(t.timestamp || t.blockTimestamp || Date.now().toString())
        }
      })

    const accumulationCount = largeTransfers.filter(t => t.direction === 'in').length
    const distributionCount = largeTransfers.filter(t => t.direction === 'out').length
    
    // Calculate volume metrics
    const totalVolume = transfers.reduce((sum, t) => 
      sum + parseFloat(t.valueFormatted || t.value || '0'), 0
    )
    const exchangeInflows = transfers
      .filter(t => this.isKnownExchange(t.to))
      .reduce((sum, t) => sum + parseFloat(t.valueFormatted || t.value || '0'), 0)
    const exchangeOutflows = transfers
      .filter(t => this.isKnownExchange(t.from))
      .reduce((sum, t) => sum + parseFloat(t.valueFormatted || t.value || '0'), 0)

    return {
      whaleActivity: {
        whaleAccumulation: accumulationCount > distributionCount,
        whaleDistribution: distributionCount > accumulationCount,
        recentLargeTransfers: largeTransfers.slice(0, 5),
        topHolders: whaleHolders.slice(0, 10).map(h => ({
          ownerAddress: h.ownerAddress,
          balanceFormatted: parseFloat(h.balanceFormatted || h.balance || '0')
        }))
      },
      volumeAnalysis: {
        totalVolume,
        transferCount: transfers.length
      },
      liquidityIndicators: {
        exchangeInflows,
        exchangeOutflows,
        netFlow: exchangeInflows - exchangeOutflows
      }
    }
  }

  /**
   * Get known contract addresses
   */
  private getKnownContractAddress(symbol: string): string | null {
    const contracts: Record<string, string> = {
      'BTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
    }
    return contracts[symbol] || null
  }

  /**
   * Check if address is a known exchange
   */
  private isKnownExchange(address: string): boolean {
    const exchanges = [
      '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', // Uniswap
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap Router
      '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance
      '0x6262998ced04146fa42253a5c0af90ca02dfd2a3', // Coinbase
    ]
    return exchanges.includes(address.toLowerCase())
  }

  /**
   * Test MCP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      
      // Test with a simple API call
      const result = await this.callNoditAPI(
        'getTokenHoldersByContract',
        'ethereum',
        'mainnet',
        { 
          contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
          rpp: 1 
        }
      )
      
      return !!(result && result.items && result.items.length > 0)
    } catch (error) {
      console.error('❌ [MCP Client] Connection test failed:', error)
      return false
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close()
        console.log('🔌 [MCP Client] Disconnected from MCP server')
      } catch (error) {
        console.error('⚠️ [MCP Client] Error during disconnect:', error)
      }
      this.client = null
      this.isConnected = false
      this.connectionPromise = null
    }
  }
}

export const mcpClient = new MCPClientService()