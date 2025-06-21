// Trading Pair Validation Service - Real-time Backend Integration

export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: 'TRADING' | 'BREAK' | 'AUCTION_MATCH' | 'HALT'
  price?: number
  priceChange?: number
  priceChangePercent?: number
  volume?: number
  isValid: boolean
}

export interface ValidationResult {
  isValid: boolean
  pair?: TradingPair
  error?: string
  suggestions?: string[]
}

// Popular trading pairs for suggestions (Only tokens with working price data)
const POPULAR_PAIRS = [
  // Major USDT pairs (verified working price data)
  'BTC/USDT', 'ETH/USDT', 'LINK/USDT', 'UNI/USDT', 'AAVE/USDT', 'ARB/USDT',
  
  // Cross pairs with major tokens (verified working)
  'BTC/ETH', 'ETH/BTC', 'BTC/USDC', 'ETH/USDC', 'LINK/USDC', 'UNI/USDC'
]

// Backend API base URL
const API_BASE_URL = 'http://localhost:3001/api'

class PairValidationService {
  private cache = new Map<string, ValidationResult>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_TTL = 30000 // 30 seconds

  /**
   * Normalize trading pair format
   * Accepts: BTC-USDT, BTC_USDT, BTCUSDT, BTC/USDT, btc/usdt
   * Returns: BTC/USDT
   */
  private normalizePair(symbol: string): string {
    const cleaned = symbol.toUpperCase().trim()
    
    // Handle different separators
    if (cleaned.includes('/')) {
      return cleaned
    } else if (cleaned.includes('-')) {
      return cleaned.replace('-', '/')
    } else if (cleaned.includes('_')) {
      return cleaned.replace('_', '/')
    } else {
      // Try to split concatenated pairs like BTCUSDT
      const commonQuotes = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'BUSD']
      for (const quote of commonQuotes) {
        if (cleaned.endsWith(quote) && cleaned.length > quote.length) {
          const base = cleaned.slice(0, -quote.length)
          return `${base}/${quote}`
        }
      }
    }
    
    return cleaned
  }

  /**
   * Get suggestions for similar pairs
   */
  private getSuggestions(input: string): string[] {
    const normalizedInput = input.toUpperCase().trim()
    
    return POPULAR_PAIRS.filter(pair => {
      const [base, quote] = pair.split('/')
      return (
        pair.includes(normalizedInput) ||
        base.includes(normalizedInput) ||
        quote.includes(normalizedInput) ||
        normalizedInput.includes(base) ||
        normalizedInput.includes(quote)
      )
    }).slice(0, 5)
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(symbol: string): boolean {
    const expiry = this.cacheExpiry.get(symbol)
    return expiry ? Date.now() < expiry : false
  }

  /**
   * Cache validation result
   */
  private setCacheResult(symbol: string, result: ValidationResult): void {
    this.cache.set(symbol, result)
    this.cacheExpiry.set(symbol, Date.now() + this.CACHE_TTL)
  }

  /**
   * Validate trading pair with real-time backend data
   */
  async validatePair(symbol: string): Promise<ValidationResult> {
    if (!symbol || symbol.trim() === '') {
      return {
        isValid: false,
        error: 'Please enter a trading pair',
        suggestions: POPULAR_PAIRS.slice(0, 5)
      }
    }

    const normalizedSymbol = this.normalizePair(symbol)
    
    // Check cache first
    if (this.isCacheValid(normalizedSymbol)) {
      return this.cache.get(normalizedSymbol)!
    }

    try {
      // Call backend API for real-time validation
      const response = await fetch(`${API_BASE_URL}/validate-trading-pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          symbol: normalizedSymbol 
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const apiResult = await response.json()
      
      if (apiResult.success && apiResult.data) {
        const result: ValidationResult = {
          isValid: true,
          pair: {
            symbol: normalizedSymbol,
            baseAsset: apiResult.data.baseAsset,
            quoteAsset: apiResult.data.quoteAsset,
            status: apiResult.data.status || 'TRADING',
            price: apiResult.data.price,
            priceChange: apiResult.data.priceChange,
            priceChangePercent: apiResult.data.priceChangePercent,
            volume: apiResult.data.volume,
            isValid: true
          }
        }
        
        this.setCacheResult(normalizedSymbol, result)
        return result
      } else {
        // Pair not found - provide suggestions
        const suggestions = this.getSuggestions(symbol)
        const result: ValidationResult = {
          isValid: false,
          error: apiResult.message || `Trading pair "${normalizedSymbol}" not found`,
          suggestions
        }
        
        this.setCacheResult(normalizedSymbol, result)
        return result
      }
    } catch (error) {
      console.error('Pair validation error:', error)
      
      // Fallback: provide suggestions when API fails
      const suggestions = this.getSuggestions(symbol)
      const result: ValidationResult = {
        isValid: false,
        error: 'Unable to validate pair. Please check your connection.',
        suggestions
      }
      
      // Don't cache failed requests
      return result
    }
  }

  /**
   * Get popular trading pairs (Nodit supported)
   */
  getPopularPairs(): string[] {
    return POPULAR_PAIRS.slice(0, 10)
  }

  /**
   * Get all supported trading pairs from backend
   */
  async getSupportedPairs(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/supported-trading-pairs`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || POPULAR_PAIRS
    } catch (error) {
      console.error('Failed to fetch supported pairs:', error)
      return POPULAR_PAIRS
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
}

export const pairValidationService = new PairValidationService()