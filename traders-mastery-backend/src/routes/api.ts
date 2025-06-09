import { Router } from 'express'
import { claudeService } from '../services/claudeService'
import { noditService } from '../services/noditService'
import { tradeTrackingService } from '../services/tradeTrackingService'
import type { TradeAnalysisRequest, ChatRequest, TradeOutcomeRequest } from '../types'

const router = Router()

// Trade analysis endpoint
router.post('/analyze-trade', async (req, res) => {
  try {
    const request: TradeAnalysisRequest = req.body

    // Validate required fields
    if (!request.sessionId || !request.tradeSetup || !request.riskMetrics) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, tradeSetup, and riskMetrics are required'
      })
    }

    const analysis = await claudeService.analyzeTradeSetup(request)
    
    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('Trade analysis error:', error)
    res.status(500).json({
      error: 'Failed to analyze trade setup',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const request: ChatRequest = req.body

    // Validate required fields
    if (!request.sessionId || !request.question) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId and question are required'
      })
    }

    const response = await claudeService.chatWithAI(request)
    
    res.json({
      success: true,
      data: {
        response,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      error: 'Failed to get AI response',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Blockchain data endpoint
router.post('/blockchain-insights', async (req, res) => {
  try {
    const { tradingPair, protocol = 'ethereum', network = 'mainnet' } = req.body

    if (!tradingPair) {
      return res.status(400).json({
        error: 'Missing required field: tradingPair'
      })
    }

    const insights = await noditService.getBlockchainInsights(tradingPair, protocol, network)
    
    res.json({
      success: true,
      data: insights
    })
  } catch (error) {
    console.error('Blockchain insights error:', error)
    res.status(500).json({
      error: 'Failed to fetch blockchain insights',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Nodit service status endpoint
router.get('/nodit-status', async (req, res) => {
  try {
    const isConnected = await noditService.testConnection()
    const supportedProtocols = noditService.getSupportedProtocols()
    const supportedNetworks = noditService.getSupportedNetworks()
    
    res.json({
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      service: 'nodit-blockchain-context',
      supportedProtocols,
      supportedNetworks
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Trade Tracking Endpoints

// Create trade outcome record when analysis is completed
router.post('/trade-outcomes', async (req, res) => {
  try {
    const { sessionId, analysis, tradeSetup } = req.body

    if (!sessionId || !analysis || !tradeSetup) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, analysis, and tradeSetup are required'
      })
    }

    const outcome = tradeTrackingService.createTradeOutcome(sessionId, analysis, tradeSetup)
    
    res.json({
      success: true,
      data: outcome
    })
  } catch (error) {
    console.error('Trade outcome creation error:', error)
    res.status(500).json({
      error: 'Failed to create trade outcome',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update trade outcome (entry, exit, notes, etc.)
router.put('/trade-outcomes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const outcome = tradeTrackingService.updateTradeOutcome(id, updates)
    
    if (!outcome) {
      return res.status(404).json({
        error: 'Trade outcome not found',
        id
      })
    }

    res.json({
      success: true,
      data: outcome
    })
  } catch (error) {
    console.error('Trade outcome update error:', error)
    res.status(500).json({
      error: 'Failed to update trade outcome',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Record trade entry
router.post('/trade-outcomes/:id/entry', async (req, res) => {
  try {
    const { id } = req.params
    const { actualEntry, entryNotes = '' } = req.body

    if (!actualEntry) {
      return res.status(400).json({
        error: 'Missing required field: actualEntry'
      })
    }

    const success = tradeTrackingService.recordTradeEntry(id, actualEntry, entryNotes)
    
    if (!success) {
      return res.status(404).json({
        error: 'Trade outcome not found or invalid state',
        id
      })
    }

    const outcome = tradeTrackingService.getTradeOutcome(id)
    res.json({
      success: true,
      data: outcome
    })
  } catch (error) {
    console.error('Trade entry recording error:', error)
    res.status(500).json({
      error: 'Failed to record trade entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Record trade exit
router.post('/trade-outcomes/:id/exit', async (req, res) => {
  try {
    const { id } = req.params
    const { actualExit, exitReason, exitNotes = '' } = req.body

    if (!actualExit || !exitReason) {
      return res.status(400).json({
        error: 'Missing required fields: actualExit and exitReason are required'
      })
    }

    const success = tradeTrackingService.recordTradeExit(id, actualExit, exitReason, exitNotes)
    
    if (!success) {
      return res.status(404).json({
        error: 'Trade outcome not found or invalid state',
        id
      })
    }

    const outcome = tradeTrackingService.getTradeOutcome(id)
    res.json({
      success: true,
      data: outcome
    })
  } catch (error) {
    console.error('Trade exit recording error:', error)
    res.status(500).json({
      error: 'Failed to record trade exit',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get trade outcomes by session
router.get('/trade-outcomes/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const outcomes = tradeTrackingService.getTradeOutcomesBySession(sessionId)
    
    res.json({
      success: true,
      data: outcomes
    })
  } catch (error) {
    console.error('Trade outcomes retrieval error:', error)
    res.status(500).json({
      error: 'Failed to retrieve trade outcomes',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get all trade outcomes with optional filtering
router.get('/trade-outcomes', async (req, res) => {
  try {
    const { startDate, endDate, tradingPairs, status } = req.query
    
    const filters: any = {}
    if (startDate) filters.startDate = parseInt(startDate as string)
    if (endDate) filters.endDate = parseInt(endDate as string)
    if (tradingPairs) filters.tradingPairs = (tradingPairs as string).split(',')
    if (status) filters.status = (status as string).split(',')
    
    const outcomes = tradeTrackingService.getAllTradeOutcomes(filters)
    
    res.json({
      success: true,
      data: outcomes
    })
  } catch (error) {
    console.error('Trade outcomes retrieval error:', error)
    res.status(500).json({
      error: 'Failed to retrieve trade outcomes',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get performance metrics
router.get('/performance-metrics', async (req, res) => {
  try {
    const { sessionId } = req.query
    const metrics = tradeTrackingService.getPerformanceMetrics(sessionId as string)
    
    res.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Performance metrics error:', error)
    res.status(500).json({
      error: 'Failed to retrieve performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get specific trade outcome
router.get('/trade-outcomes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const outcome = tradeTrackingService.getTradeOutcome(id)
    
    if (!outcome) {
      return res.status(404).json({
        error: 'Trade outcome not found',
        id
      })
    }

    res.json({
      success: true,
      data: outcome
    })
  } catch (error) {
    console.error('Trade outcome retrieval error:', error)
    res.status(500).json({
      error: 'Failed to retrieve trade outcome',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'traders-mastery-backend',
    features: {
      claudeAI: !!process.env.ANTHROPIC_API_KEY,
      noditBlockchain: true,
      realTimeData: true,
      tradeTracking: true
    }
  })
})

export default router