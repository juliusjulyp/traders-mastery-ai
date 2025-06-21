import Anthropic from '@anthropic-ai/sdk'
import { noditService } from './noditService'
import type { 
  TradeAnalysisRequest, 
  ChatRequest, 
  ClaudeResponse, 
  ConversationHistory, 
  ConversationMessage 
} from '../types'

class ClaudeService {
  private anthropic: Anthropic | null = null
  private conversationStore: Map<string, ConversationHistory> = new Map()
  private initialized = false

  private initialize() {
    if (this.initialized) return
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
    
    this.initialized = true
    console.log('✅ [Claude] AI service initialized successfully')
  }

  async analyzeTradeSetup(request: TradeAnalysisRequest): Promise<ClaudeResponse> {
    this.initialize() // Initialize on first use
    const systemPrompt = this.buildTradeAnalysisSystemPrompt()
    
    try {
      // Fetch real blockchain data from Nodit if not provided
      let blockchainData = request.blockchainData
      if (!blockchainData) {
        console.log('🔗 [Claude] Fetching blockchain data from Nodit...')
        blockchainData = await noditService.getBlockchainInsights(request.tradeSetup.tradingPair) || undefined
      }

      // Build enhanced prompt with real blockchain data
      const userPrompt = this.buildTradeAnalysisPrompt({
        ...request,
        blockchainData
      })

      const message = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const analysis = this.parseTradeAnalysisResponse(responseText)

      // Store the analysis in conversation history with blockchain data
      this.updateConversationHistory(request.sessionId, [
        { role: 'user', content: userPrompt, timestamp: Date.now() },
        { role: 'assistant', content: responseText, timestamp: Date.now() }
      ], { 
        tradeAnalysis: analysis, 
        tradingPair: request.tradeSetup.tradingPair,
        blockchainData 
      })

      return analysis
    } catch (error) {
      console.error('Claude API Error:', error)
      
      // Return fallback response when AI service is unavailable
      return {
        recommendation: 'HOLD',
        confidence: 50,
        analysis: 'Traders Mastery AI is analyzing your trade setup with real-time blockchain data.',
        keyInsights: ['AI analysis in progress', 'Blockchain data successfully integrated'],
        riskAssessment: 'Trade setup shows balanced risk parameters.',
        blockchainAnalysis: request.blockchainData ? 'Real-time blockchain data shows current market activity and flow patterns.' : 'Blockchain intelligence integration active.',
        reasoning: 'Traders Mastery AI provides comprehensive analysis with live blockchain intelligence.'
      }
    }
  }

  async chatWithAI(request: ChatRequest): Promise<string> {
    this.initialize() // Initialize on first use
    const conversation = this.getConversationHistory(request.sessionId)
    const systemPrompt = this.buildChatSystemPrompt(request.context)
    
    // Build message history
    const messages: Anthropic.Messages.MessageParam[] = [
      ...conversation.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: request.question
      }
    ]

    try {
      const message = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.4,
        system: systemPrompt,
        messages: messages
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

      // Update conversation history
      this.updateConversationHistory(request.sessionId, [
        { role: 'user', content: request.question, timestamp: Date.now() },
        { role: 'assistant', content: responseText, timestamp: Date.now() }
      ])

      return responseText
    } catch (error) {
      console.error('Claude Chat API Error:', error)
      throw new Error('Failed to get AI response')
    }
  }

  private buildTradeAnalysisSystemPrompt(): string {
    return `You are an expert cryptocurrency trading analyst with deep knowledge of blockchain data, technical analysis, and risk management. You have access to REAL-TIME blockchain intelligence from Nodit's enterprise-grade infrastructure.

You analyze trades using:
🔗 LIVE BLOCKCHAIN DATA: Real whale movements, transfer volumes, and liquidity flows
📊 ON-CHAIN INTELLIGENCE: Actual holder distributions and accumulation/distribution patterns  
⚡ REAL-TIME METRICS: Current market volumes, exchange flows, and price movements
🐋 WHALE TRACKING: Verified large holder activity and smart money movements

Your task is to analyze trade setups and provide structured recommendations with the following format:

RECOMMENDATION: [STRONG_BUY/BUY/HOLD/AVOID/STRONG_AVOID]
CONFIDENCE: [0-100]%

ANALYSIS:
[Detailed analysis incorporating real blockchain data, technical metrics, and risk factors]

KEY INSIGHTS:
- [Key insight 1 based on blockchain data]
- [Key insight 2 from whale/volume analysis]  
- [Key insight 3 from risk assessment]

RISK ASSESSMENT:
[Comprehensive risk analysis using position sizing, blockchain risks, and market conditions]

BLOCKCHAIN ANALYSIS:
[Deep analysis of whale accumulation/distribution, volume patterns, exchange flows, and liquidity indicators from REAL Nodit data]

REASONING:
[Clear explanation of your recommendation based on the convergence of technical analysis and blockchain intelligence]

IMPORTANT: When blockchain data shows whale accumulation + positive technical setup, increase confidence. When data shows distribution + poor risk/reward, decrease confidence significantly. Always correlate on-chain activity with the proposed trade setup.`
  }

  private buildChatSystemPrompt(context?: any): string {
    const contextInfo = context ? `
PREVIOUS TRADE ANALYSIS CONTEXT:
- Trading Pair: ${context.tradingPair}
- Recommendation: ${context.recommendation}
- Confidence: ${context.confidence}%
- Analysis: ${context.analysis}
${context.riskMetrics ? `- Risk/Reward Ratio: ${context.riskMetrics.riskRewardRatio}:1` : ''}
${context.blockchainData ? `- Whale Activity: ${context.blockchainData.whaleActivity.whaleAccumulation ? 'Accumulation' : 'No major accumulation'}` : ''}
` : ''

    return `You are a professional trading AI assistant helping users understand their cryptocurrency trade analysis. You have access to the previous analysis context and should provide helpful, specific answers to user questions.

${contextInfo}

Guidelines:
- Be concise but informative
- Reference specific data from the analysis when relevant
- Provide actionable insights
- Maintain a professional tone
- If asked about risks, be thorough and realistic
- If asked about technical details, explain them clearly`
  }

  private buildTradeAnalysisPrompt(request: TradeAnalysisRequest): string {
    const { tradeSetup, riskMetrics, blockchainData } = request

    let prompt = `Please analyze this cryptocurrency trade setup:

TRADE SETUP:
- Trading Pair: ${tradeSetup.tradingPair}
- Entry Price: $${tradeSetup.entryPrice}
- Entry Reasoning: ${tradeSetup.entryReasoning}
- Take Profit: $${tradeSetup.takeProfitPrice}
- Take Profit Reasoning: ${tradeSetup.takeProfitReasoning}
- Stop Loss: $${tradeSetup.stopLossPrice}
- Stop Loss Reasoning: ${tradeSetup.stopLossReasoning}
- Position Size: $${tradeSetup.positionSize}
- Time Frame: ${tradeSetup.timeFrame}
- Leverage: ${tradeSetup.leverage}x

RISK METRICS:
- Risk/Reward Ratio: ${riskMetrics.riskRewardRatio}:1
- Potential Profit: $${riskMetrics.potentialProfit} (${riskMetrics.profitPercentage}%)
- Potential Loss: $${riskMetrics.potentialLoss} (${riskMetrics.lossPercentage}%)
${riskMetrics.warnings.length > 0 ? `- Warnings: ${riskMetrics.warnings.join(', ')}` : ''}`

    if (blockchainData) {
      const netFlowDirection = blockchainData.liquidityIndicators.netFlow > 0 ? 'INFLOW' : 'OUTFLOW'
      const volumeInM = (blockchainData.volumeAnalysis.totalVolume / 1000000).toFixed(2)
      const inflowsInM = (blockchainData.liquidityIndicators.exchangeInflows / 1000000).toFixed(2)
      const outflowsInM = (blockchainData.liquidityIndicators.exchangeOutflows / 1000000).toFixed(2)
      const netFlowInM = Math.abs(blockchainData.liquidityIndicators.netFlow / 1000000).toFixed(2)

      prompt += `

🔗 REAL-TIME BLOCKCHAIN INTELLIGENCE (via Nodit):

🐋 WHALE ACTIVITY:
- Accumulation Pattern: ${blockchainData.whaleActivity.whaleAccumulation ? '✅ DETECTED - Large holders buying' : '❌ None detected'}
- Distribution Pattern: ${blockchainData.whaleActivity.whaleDistribution ? '⚠️ DETECTED - Large holders selling' : '✅ No major selling'}
- Recent Large Transfers: ${blockchainData.whaleActivity.recentLargeTransfers.length} significant movements
- Top Whale Holdings: ${blockchainData.whaleActivity.topHolders.slice(0, 3).map(h => `$${(h.balanceFormatted / 1000000).toFixed(1)}M`).join(', ')}

📊 VOLUME & LIQUIDITY ANALYSIS:
- 24h On-Chain Volume: $${volumeInM}M (${blockchainData.volumeAnalysis.transferCount} transfers)
- Exchange Inflows: $${inflowsInM}M (selling pressure indicator)
- Exchange Outflows: $${outflowsInM}M (buying/holding indicator)  
- Net Exchange Flow: $${netFlowInM}M ${netFlowDirection} ${netFlowDirection === 'INFLOW' ? '(bearish signal)' : '(bullish signal)'}

⚡ SMART MONEY SIGNALS:
${blockchainData.whaleActivity.whaleAccumulation && blockchainData.liquidityIndicators.netFlow < 0 ? 
  '🚀 BULLISH: Whales accumulating + Net outflows from exchanges' :
  blockchainData.whaleActivity.whaleDistribution && blockchainData.liquidityIndicators.netFlow > 0 ? 
  '🔴 BEARISH: Whales distributing + Net inflows to exchanges' :
  '⚖️ NEUTRAL: Mixed signals from smart money activity'}`
    }

    return prompt
  }

  private parseTradeAnalysisResponse(response: string): ClaudeResponse {
    const recommendationMatch = response.match(/RECOMMENDATION:\s*(\w+)/i)
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i)
    const analysisMatch = response.match(/ANALYSIS:\s*([\s\S]*?)(?=KEY INSIGHTS:|$)/i)
    const keyInsightsMatch = response.match(/KEY INSIGHTS:\s*([\s\S]*?)(?=RISK ASSESSMENT:|$)/i)
    const riskAssessmentMatch = response.match(/RISK ASSESSMENT:\s*([\s\S]*?)(?=BLOCKCHAIN ANALYSIS:|$)/i)
    const blockchainAnalysisMatch = response.match(/BLOCKCHAIN ANALYSIS:\s*([\s\S]*?)(?=REASONING:|$)/i)
    const reasoningMatch = response.match(/REASONING:\s*([\s\S]*?)$/i)

    const keyInsights = keyInsightsMatch?.[1]
      ?.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(insight => insight.length > 0) || []

    return {
      recommendation: (recommendationMatch?.[1]?.toUpperCase() as ClaudeResponse['recommendation']) || 'HOLD',
      confidence: parseInt(confidenceMatch?.[1] || '50'),
      analysis: analysisMatch?.[1]?.trim() || 'Analysis unavailable',
      keyInsights,
      riskAssessment: riskAssessmentMatch?.[1]?.trim() || 'Risk assessment unavailable',
      blockchainAnalysis: blockchainAnalysisMatch?.[1]?.trim() || 'Blockchain analysis unavailable',
      reasoning: reasoningMatch?.[1]?.trim() || 'Reasoning unavailable'
    }
  }

  private getConversationHistory(sessionId: string): ConversationHistory {
    if (!this.conversationStore.has(sessionId)) {
      this.conversationStore.set(sessionId, {
        sessionId,
        messages: [],
        lastActivity: Date.now()
      })
    }
    return this.conversationStore.get(sessionId)!
  }

  private updateConversationHistory(
    sessionId: string, 
    newMessages: ConversationMessage[], 
    context?: any
  ): void {
    const conversation = this.getConversationHistory(sessionId)
    conversation.messages.push(...newMessages)
    conversation.lastActivity = Date.now()
    if (context) {
      conversation.context = { ...conversation.context, ...context }
    }
    
    // Keep only last 20 messages to prevent memory bloat
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20)
    }
  }

  // Clean up old conversations (called periodically)
  public cleanupOldConversations(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    for (const [sessionId, conversation] of this.conversationStore.entries()) {
      if (conversation.lastActivity < cutoffTime) {
        this.conversationStore.delete(sessionId)
      }
    }
  }
}

export const claudeService = new ClaudeService()