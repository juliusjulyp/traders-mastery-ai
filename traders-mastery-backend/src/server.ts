// Load environment variables FIRST
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import apiRoutes from './routes/api'
import { errorHandler } from './middleware/errorHandler'
import { claudeService } from './services/claudeService'
import { noditService } from './services/noditService'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175'
]
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API routes
app.use('/api', apiRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Traders Mastery Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      analyzeTradeSetup: 'POST /api/analyze-trade',
      chat: 'POST /api/chat'
    }
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  })
})

// Cleanup function for old conversations
setInterval(() => {
  claudeService.cleanupOldConversations()
}, 60 * 60 * 1000) // Run every hour

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Traders Mastery Backend running on port ${PORT}`)
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set. Claude AI analysis will fail.')
  }
  
  if (!process.env.NODIT_API_KEY) {
    console.warn('⚠️  WARNING: NODIT_API_KEY not set. Blockchain data features will fail.')
  } else {
    console.log('✅ NODIT_API_KEY is configured')
  }

  // Test Nodit service connection
  console.log('🔗 Testing Nodit blockchain service...')
  const noditConnected = await noditService.testConnection()
  if (noditConnected) {
    console.log('✅ Nodit blockchain service connected successfully')
    console.log(`🌐 Supported protocols: ${noditService.getSupportedProtocols().join(', ')}`)
  } else {
    console.warn('⚠️  Nodit blockchain service connection failed')
  }
  
  console.log('')
  console.log('🎯 Available Features:')
  console.log('   • Claude AI Trading Analysis')
  console.log('   • Real-time Blockchain Intelligence (Nodit)')
  console.log('   • Whale Activity Detection')
  console.log('   • Volume & Liquidity Analysis')
  console.log('   • Conversation History Management')
  console.log('')
  console.log('📋 Quick Test Endpoints:')
  console.log(`   • Health Check: GET http://localhost:${PORT}/api/health`)
  console.log(`   • Nodit Status: GET http://localhost:${PORT}/api/nodit-status`)
  console.log(`   • Blockchain Data: POST http://localhost:${PORT}/api/blockchain-insights`)
  console.log('')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})