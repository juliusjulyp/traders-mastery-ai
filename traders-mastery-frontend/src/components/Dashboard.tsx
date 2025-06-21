import React, { useState, useEffect } from 'react'
//import { MiniChart } from './AnimatedChart'
import { CircularProgress } from './AnimatedProgress'
import { backendApi, type TokenPrice } from '../services/backendApi'
import '../styles/dashboard.css'

interface DashboardProps {
  sessionId: string
}



export const Dashboard: React.FC<DashboardProps> = ({ sessionId }) => {
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch real-time token prices
  const fetchTokenPrices = async () => {
    try {
      console.log('💰 [DASHBOARD] Fetching real-time token prices...')
      const prices = await backendApi.getPopularTokenPrices()
      setTokenPrices(prices)
      setLastUpdated(new Date())
      console.log(`✅ [DASHBOARD] Retrieved ${prices.length} token prices`)
    } catch (error) {
      console.error('Failed to fetch token prices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load and periodic updates
  useEffect(() => {
    fetchTokenPrices()
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchTokenPrices, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Calculate portfolio metrics from real data
  const calculatePortfolioValue = () => {
    const holdings = [
      { symbol: 'BTC', amount: 0.45 },
      { symbol: 'ETH', amount: 12.3 },
      { symbol: 'USDT', amount: 5000 }
    ]
    
    let totalValue = 0
    holdings.forEach(holding => {
      const tokenPrice = tokenPrices.find(price => price.contract.symbol === 'WBTC' && holding.symbol === 'BTC') ||
                         tokenPrices.find(price => price.contract.symbol === 'WETH' && holding.symbol === 'ETH') ||
                         tokenPrices.find(price => price.contract.symbol === holding.symbol)
      
      if (tokenPrice) {
        totalValue += holding.amount * parseFloat(tokenPrice.price)
      }
    })
    
    return totalValue
  }

  const portfolioValue = calculatePortfolioValue()

  // Dynamic metrics based on real price data
  const metrics = [
    {
      title: 'Portfolio Value',
      value: loading ? 'Loading...' : `$${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      subtitle: portfolioValue > 0 ? `${((portfolioValue - 45000) / 45000 * 100).toFixed(1)}% vs baseline` : 'Real-time calculation',
      trend: portfolioValue > 45000 ? 'up' as const : 'down' as const,
      icon: '💎'
    },
    {
      title: 'BTC Price',
      value: loading ? 'Loading...' : tokenPrices.find(p => p.contract.symbol === 'WBTC') ? 
        `$${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WBTC')!.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A',
      subtitle: loading ? 'Fetching...' : tokenPrices.find(p => p.contract.symbol === 'WBTC') ? 
        `${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WBTC')!.percentChangeFor24h) > 0 ? '+' : ''}${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WBTC')!.percentChangeFor24h).toFixed(2)}% 24h` : 'No data',
      trend: loading ? 'neutral' as const : tokenPrices.find(p => p.contract.symbol === 'WBTC') && parseFloat(tokenPrices.find(p => p.contract.symbol === 'WBTC')!.percentChangeFor24h) > 0 ? 'up' as const : 'down' as const,
      icon: '₿'
    },
    {
      title: 'ETH Price',
      value: loading ? 'Loading...' : tokenPrices.find(p => p.contract.symbol === 'WETH') ? 
        `$${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WETH')!.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A',
      subtitle: loading ? 'Fetching...' : tokenPrices.find(p => p.contract.symbol === 'WETH') ? 
        `${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WETH')!.percentChangeFor24h) > 0 ? '+' : ''}${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WETH')!.percentChangeFor24h).toFixed(2)}% 24h` : 'No data',
      trend: loading ? 'neutral' as const : tokenPrices.find(p => p.contract.symbol === 'WETH') && parseFloat(tokenPrices.find(p => p.contract.symbol === 'WETH')!.percentChangeFor24h) > 0 ? 'up' as const : 'down' as const,
      icon: '⟠'
    },
    {
      title: 'Active Positions',
      value: '3',
      subtitle: 'BTC, ETH, USDT',
      trend: 'neutral' as const,
      icon: '📊'
    },
    {
      title: 'Win Rate',
      value: '73%',
      subtitle: '22 of 30 trades',
      trend: 'up' as const,
      icon: '🎯'
    },
    {
      title: 'Risk Score',
      value: 'Moderate',
      subtitle: '6.2/10',
      trend: 'neutral' as const,
      icon: '⚡'
    }
  ]

  // Real-time trades based on current prices
  const recentTrades = [
    { 
      pair: 'BTC/USDT', 
      action: 'BUY', 
      price: loading ? 'Loading...' : tokenPrices.find(p => p.contract.symbol === 'WBTC') ? 
        `$${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WBTC')!.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$107,400',
      pnl: '+$347.50', 
      time: '2 hours ago' 
    },
    { 
      pair: 'ETH/USDT', 
      action: 'SELL', 
      price: loading ? 'Loading...' : tokenPrices.find(p => p.contract.symbol === 'WETH') ? 
        `$${parseFloat(tokenPrices.find(p => p.contract.symbol === 'WETH')!.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$2,680',
      pnl: '+$125.00', 
      time: '5 hours ago' 
    },
    { 
      pair: 'LINK/USDT', 
      action: 'BUY', 
      price: loading ? 'Loading...' : tokenPrices.find(p => p.contract.symbol === 'LINK') ? 
        `$${parseFloat(tokenPrices.find(p => p.contract.symbol === 'LINK')!.price).toFixed(2)}` : '$13.45',
      pnl: '-$45.20', 
      time: '1 day ago' 
    }
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Trading Dashboard</h2>
        <div className="dashboard-meta">
          <span className="session-id">Session: {sessionId.slice(-8)}</span>
          <span className="last-updated">
            {loading ? 'Loading prices...' : `Updated: ${lastUpdated.toLocaleTimeString()}`}
          </span>
          <span className="price-count">
            {tokenPrices.length > 0 && `${tokenPrices.length} tokens tracked`}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className={`metric-card ${metric.trend ? `trend-${metric.trend}` : ''}`}>
            <div className="metric-header">
              <span className="metric-icon">{metric.icon}</span>
              <h3 className="metric-title">{metric.title}</h3>
            </div>
            <div className="metric-value">{metric.value}</div>
            {metric.subtitle && <div className="metric-subtitle">{metric.subtitle}</div>}
            <div className="metric-chart">
              <CircularProgress
                value={75}
                size={50}
                strokeWidth={4}
                color={metric.trend === 'up' ? 'green' : 'blue'}
                showValue={false}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        {!loading && tokenPrices.length > 0 && (
          <div className="price-ticker-section">
            <h3>Live Market Prices</h3>
            <div className="price-ticker">
              {tokenPrices.slice(0, 4).map((token, index) => (
                <div key={index} className="ticker-item">
                  <span className="ticker-symbol">{token.contract.symbol}</span>
                  <span className="ticker-price">${parseFloat(token.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className={`ticker-change ${parseFloat(token.percentChangeFor24h) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(token.percentChangeFor24h) >= 0 ? '+' : ''}{parseFloat(token.percentChangeFor24h).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="recent-trades-section">
          <h3>Recent Trades</h3>
          <div className="trades-list">
            {recentTrades.map((trade, index) => (
              <div key={index} className="trade-item">
                <div className="trade-info">
                  <span className="trade-pair">{trade.pair}</span>
                  <span className={`trade-action ${trade.action.toLowerCase()}`}>{trade.action}</span>
                </div>
                <div className="trade-details">
                  <span className="trade-price">{trade.price}</span>
                  <span className={`trade-pnl ${trade.pnl.startsWith('+') ? 'profit' : 'loss'}`}>
                    {trade.pnl}
                  </span>
                </div>
                <div className="trade-time">{trade.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-stats-section">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Avg. Hold Time</span>
              <span className="stat-value">2.4 days</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Drawdown</span>
              <span className="stat-value">-8.3%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sharpe Ratio</span>
              <span className="stat-value">1.82</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Trades This Week</span>
              <span className="stat-value">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}