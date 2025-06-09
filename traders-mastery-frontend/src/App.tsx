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
import type { MCPBlockchainInsights } from './services/mcpBlockchainService'
import { TradeSetupForm, type TradeSetupFormData } from './components/TradeSetupForm'
import { TerminalPanel } from './components/TerminalPanel'
import { TradeOutcomePanel, PerformanceMetrics } from './components/TradeOutcomePanel'

// Using TradeSetupFormData from component

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
  const [blockchainData, setBlockchainData] = useState<BlockchainInsights | MCPBlockchainInsights | null>(null)
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)


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
      let blockchainInsights: BlockchainInsights | MCPBlockchainInsights | null = null
      
      try {
        // Fetch blockchain data from backend (MCP with HTTP fallback)
        setAnalysisStep('🔗 Connecting to blockchain data services...')
        blockchainInsights = await backendApi.getBlockchainInsights(tradeSetup.tradingPair)
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
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setAnalysis(tradeAnalysis)
    } catch (error) {
      setErrors(['Failed to analyze trade setup. Please try again.'])
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Traders Mastery AI</h1>
        <p>Intelligent Trading Assistant</p>
      </header>

      <main className="main-content">
        <div className="app-grid">
          <TradeSetupForm
            tradeSetup={tradeSetup}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            errors={errors}
            isAnalyzing={isAnalyzing}
            analysisStep={analysisStep}
          />
          
          <TerminalPanel
            analysis={analysis}
            blockchainData={blockchainData}
            tradingPair={tradeSetup.tradingPair}
          />
        </div>

        {/* Trade Tracking Section - Separate from main analysis */}
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
      </main>
    </div>
  )
}

export default App