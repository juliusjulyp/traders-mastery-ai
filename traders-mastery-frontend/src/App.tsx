import { useState } from 'react'
import './styles/index.css'
import './styles/typewriter.css'
import { 
  validateTradeSetup, 
  calculateRiskMetrics, 
  generateTradeRecommendation,
  convertFormToTradeSetup,
  type TradeAnalysis
} from './utils/tradeAnalysis'
import { backendApi } from './services/backendApi'
import type { BlockchainInsights } from './services/backendApi'
import { TradeSetupForm, type TradeSetupFormData } from './components/TradeSetupForm'
import { RiskCalculator } from './components/RiskCalculator'
import { TerminalPanel } from './components/TerminalPanel'
import { TradeOutcomePanel, PerformanceMetrics } from './components/TradeOutcomePanel'
import { Dashboard } from './components/Dashboard'
import { TabNavigation, type TabId } from './components/TabNavigation'
import { Sidebar } from './components/Sidebar'
import { ThemeProvider, ThemeSelector } from './components/ThemeProvider'
import { QuickTradeFAB } from './components/FloatingActionButton'
import { AnimatedProgress, AnalysisProgress } from './components/AnimatedProgress'

// Using TradeSetupFormData from component

// Protocol detection for blockchain data
function getProtocolForToken(tokenSymbol: string): string {
  const tokenProtocolMap: Record<string, string> = {
    'XRP': 'xrpl',
    'BTC': 'ethereum', // Use WBTC contract on Ethereum for BTC trading data
    'DOGE': 'dogecoin',
    'TRX': 'tron',
    // Default to ethereum for ERC-20 tokens
    'ETH': 'ethereum',
    'USDT': 'ethereum',
    'USDC': 'ethereum',
    'LINK': 'ethereum',
    'UNI': 'ethereum',
    'AAVE': 'ethereum'
  }
  
  return tokenProtocolMap[tokenSymbol] || 'ethereum'
}

function App() {
  const [tradeSetup, setTradeSetup] = useState<TradeSetupFormData>({
    tradingPair: '',
    entryPrice: '',
    entryReasoning: '',
    takeProfitPrice: '',
    takeProfitReasoning: '',
    stopLossPrice: '',
    stopLossReasoning: '',
    positionSize: '',
    timeFrame: '',
    leverage: ''
  })

  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [blockchainData, setBlockchainData] = useState<BlockchainInsights | null>(null)
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)


  const handleInputChange = (field: keyof TradeSetupFormData, value: string) => {
    setTradeSetup(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setErrors([])

    const tradeSetupTyped = convertFormToTradeSetup(tradeSetup)

    const validation = validateTradeSetup(tradeSetupTyped)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      setIsAnalyzing(false)
      return
    }

    try {
      // Step 1: Validate trading setup
      setAnalysisStep('🔍 Validating trade setup and risk parameters...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const riskMetrics = calculateRiskMetrics(tradeSetupTyped)
      
      // Step 2: Fetch blockchain intelligence via pure MCP
      setAnalysisStep('🔗 Connecting to Nodit MCP blockchain services...')
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setAnalysisStep('🐋 Analyzing whale holders and large transfers via MCP...')
      let blockchainInsights: BlockchainInsights | null = null
      
      try {
        // Fetch blockchain data from backend (MCP with HTTP fallback)
        setAnalysisStep('🔗 Connecting to blockchain data services...')
        
        // Auto-detect protocol based on trading pair
        const tokenSymbol = tradeSetup.tradingPair.split('/')[0].toUpperCase()
        const protocol = getProtocolForToken(tokenSymbol)
        
        blockchainInsights = await backendApi.getBlockchainInsights(tradeSetup.tradingPair, protocol)
        setBlockchainData(blockchainInsights)
        
        setAnalysisStep('📊 Processing on-chain volume and liquidity flows...')
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setAnalysisStep('🤖 AI analyzing blockchain data patterns...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.warn('Could not fetch blockchain data:', error)
        setAnalysisStep('⚠️ Proceeding with technical analysis only...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Step 3: Generate AI recommendation
      setAnalysisStep('🧠 Generating AI-powered trade recommendation...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const tradeAnalysis = await generateTradeRecommendation(riskMetrics, tradeSetupTyped, blockchainInsights || undefined)
      
      setAnalysisStep('✅ Analysis complete!')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setAnalysis(tradeAnalysis)
      
      // Show transition message and smoothly navigate to terminal
      setAnalysisStep('🔄 Switching to terminal...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setActiveTab('terminal')
    } catch (error) {
      setErrors(['Failed to analyze trade setup. Please try again.'])
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }


  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sessionId={sessionId} />
      case 'analysis':
        return (
          <div className="analysis-content">
            <div className="analysis-grid">
              <div className="form-section">
                <TradeSetupForm
                  tradeSetup={tradeSetup}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                  errors={errors}
                  isAnalyzing={isAnalyzing}
                  analysisStep={analysisStep}
                />
              </div>
              
              <div className="sidebar-section">
                <RiskCalculator
                  entryPrice={tradeSetup.entryPrice}
                  takeProfitPrice={tradeSetup.takeProfitPrice}
                  stopLossPrice={tradeSetup.stopLossPrice}
                  positionSize={tradeSetup.positionSize}
                  leverage={tradeSetup.leverage}
                  onPositionSizeChange={(size) => handleInputChange('positionSize', size)}
                />
                
                
                <div className="analysis-visualizations">
                  {isAnalyzing && (
                    <AnalysisProgress
                      steps={[
                        'Validating Setup',
                        'Fetching Data', 
                        'AI Analysis',
                        'Generating Report'
                      ]}
                      currentStep={analysisStep ? 2 : 0}
                    />
                  )}
                  <AnimatedProgress
                    value={isAnalyzing ? 65 : 100}
                    label="Analysis Progress"
                    color="blue"
                    striped
                    glowing
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 'terminal':
        return (
          <TerminalPanel
            analysis={analysis}
            blockchainData={blockchainData}
            tradingPair={tradeSetup.tradingPair}
          />
        )
      case 'tracking':
        return (
          <div className="trade-tracking-section">
            {analysis && tradeSetup.tradingPair && (
              <TradeOutcomePanel
                analysis={analysis}
                tradingPair={tradeSetup.tradingPair}
                tradeSetup={{
                  entryPrice: parseFloat(tradeSetup.entryPrice) || 0,
                  takeProfitPrice: parseFloat(tradeSetup.takeProfitPrice) || 0,
                  stopLossPrice: parseFloat(tradeSetup.stopLossPrice) || 0,
                  positionSize: parseFloat(tradeSetup.positionSize) || 0,
                  leverage: parseFloat(tradeSetup.leverage) || 1,
                  timeFrame: tradeSetup.timeFrame
                }}
                sessionId={sessionId}
              />
            )}
            <PerformanceMetrics sessionId={sessionId} />
          </div>
        )
      default:
        return <Dashboard sessionId={sessionId} />
    }
  }

  return (
    <ThemeProvider defaultTheme="matrix" defaultMode="dark">
      <div className="app">
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={`main-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="platform-notice">
            <div className="notice-content">
              <span className="notice-icon">🚀</span>
              <span className="notice-text">
                <strong>Trading Mastery Platform:</strong> Improve your trading skills with AI-powered trade analysis, 
                performance tracking, and personalized recommendations. 
                <em>Analysis tool, not trading signals.</em>
              </span>
            </div>
          </div>
          
          <header className="app-header">
            <div className="header-content">
              <div className="header-title">
                <h1>Traders Mastery AI</h1>
                <p>Intelligent Trading Assistant</p>
              </div>
              <div className="header-controls">
                <ThemeSelector compact showModeToggle />
                <button 
                  className="theme-panel-toggle"
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  title="Theme Settings"
                >
                  🎨
                </button>
              </div>
            </div>
          </header>

          {showThemeSelector && (
            <div className="theme-panel-overlay">
              <div className="theme-panel">
                <button 
                  className="theme-panel-close"
                  onClick={() => setShowThemeSelector(false)}
                >
                  ✕
                </button>
                <ThemeSelector showModeToggle={false} />
              </div>
            </div>
          )}

          <main className="main-content">
            <TabNavigation 
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            <div className="tab-content active">
              {renderTabContent()}
            </div>
          </main>
        </div>

        <QuickTradeFAB
          onNewTrade={() => setActiveTab('analysis')}
          onQuickBuy={() => console.log('Quick buy')}
          onQuickSell={() => console.log('Quick sell')}
          onMarketScan={() => console.log('Market scan')}
          onAlerts={() => console.log('Alerts')}
          alertCount={3}
        />
      </div>
    </ThemeProvider>
  )
}

export default App