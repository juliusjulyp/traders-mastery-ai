// Interactive AI Chat Component
import { useState, useRef, useEffect } from 'react'
import { claudeAnalyst } from '../services/claudeAnalyst'
import type { TradeAnalysis } from '../utils/tradeAnalysis'
import type { BlockchainInsights } from '../services/backendApi'

interface AIChatProps {
  analysis: TradeAnalysis
  blockchainData: BlockchainInsights | null
  tradingPair: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: number
  isLoading?: boolean
}

export function AIChat({ analysis, blockchainData, tradingPair }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize chat with welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `🤖 AI Assistant Ready! Ask me anything about your ${tradingPair} trade analysis. I have access to all the blockchain data and risk metrics.`,
      timestamp: Date.now()
    }
    setMessages([welcomeMessage])
  }, [tradingPair])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    }

    const loadingMessage: ChatMessage = {
      id: `msg-${Date.now()}-loading`,
      type: 'ai',
      content: 'Analyzing your question...',
      timestamp: Date.now(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const aiResponse = await askAIQuestion(userMessage.content)
      
      // Replace loading message with actual response
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id))
      
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        type: 'ai',
        content: aiResponse,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('AI Chat Error:', error)
      
      // Replace loading message with error
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id))
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'ai',
        content: '❌ Sorry, I encountered an error. Please try asking your question again.',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const askAIQuestion = async (question: string): Promise<string> => {
    // Create context-aware prompt
    const contextPrompt = buildContextPrompt(question)
    
    // Use existing Claude analyst with enhanced context
    const response = await claudeAnalyst.askQuestionAboutTrade(contextPrompt, analysis, blockchainData || undefined)
    return response
  }

  const buildContextPrompt = (question: string): string => {
    return `You are a professional trading AI assistant. The user just completed a trade analysis and now has a follow-up question.

PREVIOUS ANALYSIS CONTEXT:
Trading Pair: ${tradingPair}
Recommendation: ${analysis.recommendation} (${analysis.confidence}% confidence)
Analysis: ${analysis.analysis}
Key Points: ${analysis.keyPoints.join(', ')}

${analysis.aiInsights ? `
AI INSIGHTS:
- Risk Assessment: ${analysis.aiInsights.riskAssessment}
- Blockchain Analysis: ${analysis.aiInsights.blockchainAnalysis}
` : ''}

${blockchainData ? `
BLOCKCHAIN DATA:
- Whale Activity: ${blockchainData.whaleActivity.whaleAccumulation ? 'Accumulation detected' : 'No major accumulation'}
- Volume (24h): $${(blockchainData.volumeAnalysis.totalVolume / 1000000).toFixed(1)}M
- Net Flow: $${(blockchainData.liquidityIndicators.netFlow / 1000000).toFixed(1)}M
` : ''}

RISK METRICS:
- Risk/Reward: ${analysis.riskMetrics.riskRewardRatio}:1
- Potential Profit: ${analysis.riskMetrics.profitPercentage}%
- Potential Loss: ${analysis.riskMetrics.lossPercentage}%

USER QUESTION: "${question}"

Please provide a helpful, specific answer based on the analysis context. Keep it concise but informative.`
  }


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="ai-chat-content">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="message-sender">
                {message.type === 'user' ? '👤 You' : 
                 message.type === 'ai' ? '🤖 AI Assistant' : '💻 System'}
              </span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
            <div className="message-content">
              {message.isLoading ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <pre>{message.content}</pre>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me about your trade analysis..."
            disabled={isTyping}
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="chat-send-btn"
          >
            {isTyping ? '...' : '➤'}
          </button>
        </div>
        <div className="chat-suggestions">
          <button onClick={() => setInputValue("Why did you recommend this?")}>
            Why this recommendation?
          </button>
          <button onClick={() => setInputValue("What are the main risks?")}>
            Main risks?
          </button>
          <button onClick={() => setInputValue("Tell me about whale activity")}>
            Whale activity?
          </button>
        </div>
      </div>
    </div>
  )
}