/**
 * Claude AI Trading Analyst
 * 
 * Uses backend proxy for Anthropic's Claude integration.
 * Provides intelligent trading analysis with blockchain data and conversation history.
 */

import { backendApi } from './backendApi'
import type { BlockchainInsights } from './backendApi'
import type { TradeSetup, RiskMetrics, TradeAnalysis } from '../utils/tradeAnalysis'

export interface ClaudeInsight {
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID'
  confidence: number
  analysis: string
  keyInsights: string[]
  riskAssessment: string
  blockchainAnalysis: string
  reasoning: string
}

export class ClaudeTradingAnalyst {
  private isBackendAvailable: boolean = false

  constructor() {
    this.checkBackendStatus()
  }

  private async checkBackendStatus() {
    try {
      this.isBackendAvailable = await backendApi.checkHealth()
      if (this.isBackendAvailable) {
        console.log('🤖 [Claude] Backend proxy connected and ready')
      } else {
        console.warn('⚠️ [Claude] Backend proxy not available, falling back to simulated responses')
      }
    } catch (error) {
      console.warn('⚠️ [Claude] Backend proxy connection failed:', error)
      this.isBackendAvailable = false
    }
  }

  async analyzeTradeWithClaude(
    tradeSetup: TradeSetup,
    riskMetrics: RiskMetrics,
    blockchainData?: BlockchainInsights
  ): Promise<ClaudeInsight> {
    console.log('🧠 [Claude] Analyzing trade with AI intelligence...')

    try {
      // Check backend availability first
      await this.checkBackendStatus()
      
      if (this.isBackendAvailable) {
        console.log('🔗 [Claude] Using backend proxy for real AI analysis')
        const response = await backendApi.analyzeTradeSetup(tradeSetup, riskMetrics, blockchainData)
        
        console.log(`✅ [Claude] Analysis complete. Recommendation: ${response.recommendation} (${response.confidence}% confidence)`)
        return response
      } else {
        console.log('📋 [Claude] Backend unavailable, using fallback analysis')
        return this.getFallbackAnalysis()
      }
      
    } catch (error) {
      console.error('❌ [Claude] AI analysis failed:', error)
      return this.getFallbackAnalysis()
    }
  }


  async askQuestionAboutTrade(
    contextPrompt: string,
    analysis: TradeAnalysis,
    blockchainData?: BlockchainInsights
  ): Promise<string> {
    console.log('💬 [Claude] Processing follow-up question...')

    try {
      // Check backend availability first
      await this.checkBackendStatus()
      
      if (this.isBackendAvailable) {
        console.log('🔗 [Claude] Using backend proxy for chat')
        
        // Extract question from context prompt
        const questionMatch = contextPrompt.match(/USER QUESTION: "(.*?)"/i)
        const question = questionMatch?.[1] || contextPrompt
        
        // Build context for backend
        const context = {
          tradingPair: analysis.tradingPair,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          analysis: analysis.analysis,
          riskMetrics: analysis.riskMetrics,
          blockchainData
        }
        
        const response = await backendApi.chatWithAI(question, context)
        console.log('✅ [Claude] Question answered successfully')
        return response
      } else {
        console.log('📋 [Claude] Backend unavailable, using intelligent fallback')
        return this.getIntelligentChatResponse(contextPrompt)
      }
      
    } catch (error) {
      console.error('❌ [Claude] Chat question failed:', error)
      return this.getIntelligentChatResponse(contextPrompt)
    }
  }

  private getIntelligentChatResponse(prompt: string): string {
    // Parse all the context from the prompt
    const questionMatch = prompt.match(/USER QUESTION: "(.*?)"/i)
    const question = questionMatch?.[1] || 'general question'
    
    const pairMatch = prompt.match(/Trading Pair: ([A-Z/]+)/i)
    const recommendationMatch = prompt.match(/Recommendation: ([A-Z_]+)/i)
    const confidenceMatch = prompt.match(/(\d+)% confidence/i)
    const riskRewardMatch = prompt.match(/Risk\/Reward: ([0-9.]+):1/i)
    const profitMatch = prompt.match(/Potential Profit: ([0-9.]+)%/i)
    const lossMatch = prompt.match(/Potential Loss: ([0-9.]+)%/i)
    const volumeMatch = prompt.match(/Volume \(24h\): \$([0-9.]+)M/i)
    const whaleAccumulationMatch = prompt.includes('Accumulation detected')
    const analysisMatch = prompt.match(/Analysis: ([^\n]+)/i)
    
    const pair = pairMatch?.[1] || 'this pair'
    const recommendation = recommendationMatch?.[1] || 'HOLD'
    const confidence = parseInt(confidenceMatch?.[1] || '75')
    const riskReward = parseFloat(riskRewardMatch?.[1] || '1')
    const profitPercent = parseFloat(profitMatch?.[1] || '0')
    const lossPercent = parseFloat(lossMatch?.[1] || '0')
    const volume = parseFloat(volumeMatch?.[1] || '0')
    const analysis = analysisMatch?.[1] || 'Trade analysis completed'
    
    // Intelligent response generation based on question type and context
    return this.generateContextualResponse(question, {
      pair, recommendation, confidence, riskReward, 
      profitPercent, lossPercent, volume, whaleAccumulationMatch, analysis
    })
  }
  
  private generateContextualResponse(question: string, context: {
    recommendation?: string
    pair?: string
    riskReward?: number
    profitPercent?: number
    lossPercent?: number
    confidence?: number
    whaleAccumulationMatch?: boolean
    analysis?: string
    volume?: number
  }): string {
    const lowerQ = question.toLowerCase()
    
    // Why questions - focus on reasoning
    if (lowerQ.includes('why')) {
      if (lowerQ.includes('recommend') || lowerQ.includes('suggest')) {
        return `I recommended ${context.recommendation} for ${context.pair} based on several key factors:

📊 **Risk Analysis**: ${context.riskReward || 0}:1 risk-reward ratio ${(context.riskReward || 0) >= 2 ? 'exceeds' : (context.riskReward || 0) >= 1.5 ? 'meets' : 'falls below'} professional trading standards

💰 **Profit Potential**: ${context.profitPercent || 0}% upside vs ${context.lossPercent || 0}% downside ${(context.profitPercent || 0) > (context.lossPercent || 0) * 2 ? 'shows favorable asymmetry' : 'requires careful position sizing'}

🔍 **Market Conditions**: ${context.whaleAccumulationMatch ? 'Whale accumulation detected, indicating institutional interest' : 'No major whale activity, suggesting retail-driven movement'}

⚖️ **Confidence Level**: ${context.confidence || 0}% confidence reflects ${(context.confidence || 0) >= 80 ? 'high conviction' : (context.confidence || 0) >= 65 ? 'moderate conviction' : 'low conviction'} based on available data

The ${(context.recommendation || 'HOLD').toLowerCase()} signal comes from ${(context.analysis || 'general market analysis').toLowerCase()}`
      }
      
      if (lowerQ.includes('price') || lowerQ.includes('move')) {
        return `Price movement expectations for ${context.pair}:

📈 **Bullish Scenario**: ${context.profitPercent || 0}% potential upside based on technical analysis
📉 **Bearish Scenario**: ${context.lossPercent || 0}% potential downside if trade fails

${context.whaleAccumulationMatch ? 
  '🐋 Whale accumulation suggests large players expect upward movement' : 
  '⚪ No significant whale activity - price likely driven by retail sentiment'}

${(context.volume || 0) > 50 ? 
  `💪 Strong volume (${context.volume || 0}M) supports price movement sustainability` : 
  '⚠️ Lower volume suggests potential for false breakouts'}

Remember: Markets are unpredictable. These are projections based on current data, not guarantees.`
      }
    }
    
    // How questions - focus on execution
    if (lowerQ.includes('how')) {
      if (lowerQ.includes('trade') || lowerQ.includes('execute')) {
        return `How to execute this ${context.pair} trade:

🎯 **Entry Strategy**: ${(context.recommendation || 'HOLD') === 'BUY' || (context.recommendation || 'HOLD') === 'STRONG_BUY' ? 'Enter on current levels or slight pullback' : (context.recommendation || 'HOLD') === 'AVOID' ? 'Wait for better setup' : 'Monitor for clearer signals'}

💰 **Position Sizing**: Risk only ${Math.min(2, Math.max(0.5, 3 / (context.riskReward || 1))).toFixed(1)}% of portfolio given ${context.riskReward || 0}:1 R:R

⏰ **Timing**: ${context.whaleAccumulationMatch ? 'Favorable timing with whale support' : 'Standard entry timing applies'}

🛡️ **Risk Management**: 
- Maximum loss: ${context.lossPercent || 0}%
- Take profit target: ${context.profitPercent || 0}%
- Stop loss is critical - never move it against you

📊 **Monitoring**: Watch for volume changes and whale activity shifts`
      }
      
      if (lowerQ.includes('confident') || lowerQ.includes('sure')) {
        return `My ${context.confidence || 0}% confidence comes from:

✅ **Strong Factors** (boosting confidence):
${(context.riskReward || 0) >= 2 ? '• Excellent risk-reward ratio' : ''}
${context.whaleAccumulationMatch ? '• Whale accumulation detected' : ''}
${(context.volume || 0) > 50 ? '• High trading volume' : ''}
${(context.profitPercent || 0) > (context.lossPercent || 0) * 1.5 ? '• Favorable profit asymmetry' : ''}

⚠️ **Uncertainty Factors** (limiting confidence):
${(context.riskReward || 0) < 1.5 ? '• Suboptimal risk-reward ratio' : ''}
${!context.whaleAccumulationMatch ? '• No major whale support' : ''}
${(context.volume || 0) < 20 ? '• Lower trading volume' : ''}

🎯 **Confidence Level**: ${(context.confidence || 0) >= 80 ? 'High - multiple confluences align' : (context.confidence || 0) >= 65 ? 'Moderate - decent setup with some concerns' : 'Low - proceed with extra caution'}

No trade is 100% certain. Always manage risk appropriately.`
      }
    }
    
    // What questions - focus on specifics
    if (lowerQ.includes('what')) {
      if (lowerQ.includes('risk') || lowerQ.includes('danger')) {
        return `Risk analysis for ${context.pair || 'your trading pair'}:

🚨 **Primary Risks**:
• Maximum loss: ${context.lossPercent || 0}% (based on stop loss)
• Risk-reward: ${context.riskReward || 0}:1 ${(context.riskReward || 0) < 2 ? '(below optimal)' : '(acceptable)'}

⚡ **Market Risks**:
${(context.volume || 0) < 30 ? '• Low liquidity could cause slippage' : '• Good liquidity reduces execution risk'}
${!context.whaleAccumulationMatch ? '• No whale support - vulnerable to retail sell-offs' : '• Whale accumulation provides price support'}

📊 **Trade-Specific Risks**:
• ${context.pair || 'Token'} volatility could trigger premature stops
• Market correlation with BTC/ETH could override individual signals
• News events could invalidate technical analysis

🛡️ **Risk Mitigation**:
• Never risk more than you can afford to lose
• Use proper position sizing (1-2% portfolio risk)
• Set stops and stick to them
• Monitor whale movements for early warnings`
      }
      
      if (lowerQ.includes('next') || lowerQ.includes('happen')) {
        return `What to expect next for ${context.pair || 'your trading pair'}:

📈 **Bullish Scenario** (${Math.min((context.confidence || 50) + 10, 90)}% if ${(context.recommendation || 'HOLD').includes('BUY')}):
• Price target: +${context.profitPercent || 0}%
• ${context.whaleAccumulationMatch ? 'Whale support continues' : 'Retail buying increases'}
• Volume expansion confirms move

📉 **Bearish Scenario** (${100 - (context.confidence || 50)}% probability):
• Stop loss hit: -${context.lossPercent || 0}%
• ${context.whaleAccumulationMatch ? 'Whales change strategy' : 'Retail selling pressure'}
• Volume dries up, momentum fades

⚖️ **Most Likely**: 
Based on ${context.confidence || 0}% confidence, expect ${(context.recommendation || 'HOLD').includes('BUY') ? 'upward bias with normal volatility' : (context.recommendation || 'HOLD').includes('AVOID') ? 'sideways or downward movement' : 'choppy, directionless price action'}

🔄 **Timeline**: Monitor closely for next 24-48 hours for confirmation`
      }
    }
    
    // Whale/market structure questions
    if (lowerQ.includes('whale') || lowerQ.includes('big money')) {
      return `Whale activity analysis for ${context.pair || 'your trading pair'}:

🐋 **Current Status**: ${context.whaleAccumulationMatch ? 'ACCUMULATION DETECTED' : 'NO MAJOR ACTIVITY'}

${context.whaleAccumulationMatch ? `
✅ **Bullish Signals**:
• Large holders are buying
• Institutional interest likely
• Price support at current levels
• Reduced sell pressure expected

🎯 **Implications**:
• Higher probability of upward movement
• Better risk-reward for long positions
• Less likely to see major dumps
• May attract more institutional buying` : `
⚪ **Neutral Signals**:
• No significant whale accumulation
• Price driven by retail sentiment
• Higher volatility expected
• More susceptible to panic selling

⚠️ **Implications**:
• Rely more on technical analysis
• Expect higher volatility
• Use tighter risk management
• Watch for sudden whale entries`}

💡 **Volume Context**: ${context.volume || 0}M daily volume ${(context.volume || 0) > 50 ? 'supports' : 'may not support'} sustained price moves`
    }
    
    // Should I / advice questions
    if (lowerQ.includes('should i') || lowerQ.includes('advice')) {
      return `Trading advice for ${context.pair || 'your trading pair'}:

${(context.recommendation || 'HOLD') === 'STRONG_BUY' ? '🚀 **STRONG BUY Signal**' : 
  (context.recommendation || 'HOLD') === 'BUY' ? '✅ **BUY Signal**' : 
  (context.recommendation || 'HOLD') === 'AVOID' ? '❌ **AVOID Signal**' : 
  (context.recommendation || 'HOLD') === 'STRONG_AVOID' ? '🚫 **STRONG AVOID Signal**' : 
  '⚖️ **HOLD/Neutral Signal**'}

📋 **My Recommendation**:
${(context.recommendation || 'HOLD').includes('BUY') ? 
  `• Consider entering with ${Math.min(2, 3/(context.riskReward || 1)).toFixed(1)}% portfolio risk
• Set stop loss at -${context.lossPercent || 0}%
• Take profit target: +${context.profitPercent || 0}%
• ${context.whaleAccumulationMatch ? 'Whale support adds confidence' : 'Monitor for whale activity changes'}` :
  (context.recommendation || 'HOLD').includes('AVOID') ?
  `• Wait for better setup
• Current risk-reward not favorable
• ${(context.riskReward || 0) < 1.5 ? 'Poor risk-reward ratio' : 'Lack of supporting factors'}
• Look for alternative opportunities` :
  `• No clear edge in either direction
• Consider paper trading this setup
• Wait for more definitive signals
• Focus on better risk-reward opportunities`}

⚠️ **Remember**: This is analysis, not financial advice. Always:
• Do your own research
• Never risk more than you can afford to lose
• Consider your personal risk tolerance
• Have a clear exit plan`
    }
    
    // Default intelligent response
    return `Regarding "${question}" for your ${context.pair || 'trading pair'} analysis:

🎯 **Current Situation**: ${context.recommendation || 'HOLD'} recommendation with ${context.confidence || 0}% confidence

📊 **Key Metrics**:
• Risk-Reward: ${context.riskReward || 0}:1
• Potential gain: ${context.profitPercent || 0}%
• Potential loss: ${context.lossPercent || 0}%
• Volume: ${context.volume || 0}M (${(context.volume || 0) > 50 ? 'strong' : 'moderate'})

${context.whaleAccumulationMatch ? 
  '🐋 Whale accumulation supports the bullish case' : 
  '⚪ No major whale activity - technical factors dominate'}

💡 **Context**: ${context.analysis || 'General market analysis'}

Feel free to ask more specific questions about the risks, execution strategy, or market dynamics!`
  }

  private getFallbackAnalysis(): ClaudeInsight {
    return {
      recommendation: 'HOLD',
      confidence: 50,
      analysis: 'AI analysis unavailable. Configure Claude API key in .env.local for intelligent trading analysis.',
      keyInsights: [
        'Claude API key required for AI analysis',
        'Add VITE_ANTHROPIC_API_KEY to .env.local',
        'Get API key from https://console.anthropic.com'
      ],
      riskAssessment: 'Unable to perform AI risk assessment without Claude API access',
      blockchainAnalysis: 'Blockchain intelligence available but requires AI analysis',
      reasoning: 'Configure Claude API for intelligent trading recommendations'
    }
  }
}

export const claudeAnalyst = new ClaudeTradingAnalyst()