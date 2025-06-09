import React from 'react'
import type { TradeAnalysis } from '../utils/tradeAnalysis'
import type { BlockchainInsights } from '../services/backendApi'
import type { MCPBlockchainInsights } from '../services/mcpBlockchainService'
import { AIChat } from './AIChat'

interface TerminalPanelProps {
  analysis: TradeAnalysis | null
  blockchainData: BlockchainInsights | MCPBlockchainInsights | null
  tradingPair?: string
}

export function TerminalPanel({ analysis, blockchainData, tradingPair }: TerminalPanelProps) {
  return (
    <div className="terminal-panel">
      {analysis ? (
        <div className="terminal-split-layout">
          <div className="analysis-section">
            <TerminalWindow title="📊 Analysis Results">
              <AnalysisResults analysis={analysis} blockchainData={blockchainData} />
            </TerminalWindow>
          </div>
          
          {tradingPair && (
            <div className="chat-section">
              <TerminalWindow title="💬 AI Assistant">
                <AIChat 
                  analysis={analysis} 
                  blockchainData={blockchainData} 
                  tradingPair={tradingPair} 
                />
              </TerminalWindow>
            </div>
          )}
        </div>
      ) : (
        <TerminalWaiting />
      )}
    </div>
  )
}

// Reusable Terminal Window Component
function TerminalWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="terminal-with-tabs">
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="terminal-btn red"></span>
          <span className="terminal-btn yellow"></span>
          <span className="terminal-btn green"></span>
        </div>
        <span className="terminal-title">{title}</span>
      </div>
      <div className="terminal-content-area">
        {children}
      </div>
    </div>
  )
}

function TerminalWaiting() {
  return (
    <TerminalWindow title="Traders Mastery AI Terminal">
      <div className="terminal-content">
        <div className="terminal-prompt">
          <span className="prompt-symbol">traders-ai:~$</span>
          <span className="cursor-blink">█</span>
        </div>
        <div className="terminal-info">
          <p>🤖 AI Trading Assistant Ready</p>
          <p>📊 Blockchain Intelligence: <span className="status-active">ACTIVE</span></p>
          <p>🔗 Nodit MCP Integration: <span className="status-active">CONNECTED</span></p>
          <p>🧠 Claude AI Analysis: <span className="status-active">STANDBY</span></p>
          <br/>
          <p className="terminal-instruction">Configure your trade setup to begin analysis...</p>
        </div>
      </div>
    </TerminalWindow>
  )
}

// Animated Section Component - Reusable for any content (temporarily disabled animation)
function AnimatedSection({ children }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="fade-in visible">
      {children}
    </div>
  )
}

function AnalysisResults({ analysis, blockchainData }: { analysis: TradeAnalysis; blockchainData: BlockchainInsights | MCPBlockchainInsights | null }) {
  return (
    <div className="analysis-results">
      <h2>Trade Analysis Results</h2>
      
      {analysis.aiInsights?.isAiGenerated && (
        <AnimatedSection delay={200}>
          <div className="ai-indicator">
            <span className="ai-badge">🤖 AI-Powered by {analysis.aiInsights.provider}</span>
            <p>This analysis was generated using artificial intelligence</p>
          </div>
        </AnimatedSection>
      )}
      
      <AnimatedSection delay={400}>
        <div className={`recommendation ${analysis.recommendation.toLowerCase()}`}>
          <h3>Recommendation: {analysis.recommendation.replace('_', ' ')}</h3>
          <div className="confidence">Confidence: {analysis.confidence}%</div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={600}>
        <div className="analysis-text">
          <p>{analysis.analysis}</p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={800}>
        <RiskMetrics riskMetrics={analysis.riskMetrics} />
      </AnimatedSection>

      {analysis.keyPoints.length > 0 && (
        <AnimatedSection delay={1000}>
          <KeyPoints keyPoints={analysis.keyPoints} />
        </AnimatedSection>
      )}

      {blockchainData ? (
        <AnimatedSection delay={1200}>
          <BlockchainDataDisplay blockchainData={blockchainData} />
        </AnimatedSection>
      ) : (
        <div style={{color: 'red', padding: '10px'}}>
          🐛 [DEBUG] No blockchain data received
        </div>
      )}

      {analysis.aiInsights?.isAiGenerated && (
        <AnimatedSection delay={1400}>
          <AIInsights aiInsights={analysis.aiInsights} />
        </AnimatedSection>
      )}

      {analysis.blockchainInsights && (
        <AnimatedSection delay={1600}>
          <BlockchainInsights insights={analysis.blockchainInsights} />
        </AnimatedSection>
      )}
    </div>
  )
}

// Simplified Components - No More Duplication
function RiskMetrics({ riskMetrics }: { riskMetrics: TradeAnalysis['riskMetrics'] }) {
  return (
    <div className="risk-metrics">
      <h3>Risk Metrics</h3>
      <div className="metrics-grid">
        <div className="metric">
          <label>Risk-Reward Ratio</label>
          <span className={riskMetrics.riskRewardRatio >= 2 ? 'good' : riskMetrics.riskRewardRatio >= 1.5 ? 'average' : 'poor'}>
            {riskMetrics.riskRewardRatio}:1
          </span>
        </div>
        <div className="metric">
          <label>Potential Profit</label>
          <span className="profit">{riskMetrics.potentialProfit} ({riskMetrics.profitPercentage}%)</span>
        </div>
        <div className="metric">
          <label>Potential Loss</label>
          <span className="loss">{riskMetrics.potentialLoss} ({riskMetrics.lossPercentage}%)</span>
        </div>
      </div>
    </div>
  )
}

function KeyPoints({ keyPoints }: { keyPoints: string[] }) {
  return (
    <div className="key-points">
      <h3>Key Analysis Points</h3>
      <ul>
        {keyPoints.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </div>
  )
}

function BlockchainDataDisplay({ blockchainData }: { blockchainData: BlockchainInsights | MCPBlockchainInsights }) {
  console.log('🐛 [DEBUG] BlockchainDataDisplay received data:', blockchainData)
  
  return (
    <div className="raw-blockchain-data">
      <h3>📡 Live Blockchain Data (Nodit MCP)</h3>
      <div className="data-section">
        <h4>Top Whale Holders</h4>
        <div className="whale-list">
          {blockchainData.whaleActivity.topHolders.slice(0, 3).map((whale, index) => (
            <div key={index} className="whale-item">
              <span className="whale-address">{whale.ownerAddress.slice(0, 8)}...{whale.ownerAddress.slice(-6)}</span>
              <span className="whale-balance">${(whale.balanceFormatted / 1000000).toFixed(1)}M</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="data-section">
        <h4>Recent Large Transfers</h4>
        <div className="transfer-stats">
          <span>Volume: ${(blockchainData.volumeAnalysis.totalVolume / 1000000).toFixed(0)}M</span>
          <span>Transfers: {blockchainData.volumeAnalysis.transferCount}</span>
          <span>Net Flow: ${(blockchainData.liquidityIndicators.netFlow / 1000000).toFixed(0)}M</span>
        </div>
      </div>
    </div>
  )
}

function AIInsights({ aiInsights }: { aiInsights: NonNullable<TradeAnalysis['aiInsights']> }) {
  return (
    <div className="ai-insights">
      <h3>🧠 Claude AI Analysis</h3>
      
      <div className="ai-section">
        <h4>Risk Assessment</h4>
        <p>{aiInsights.riskAssessment}</p>
      </div>
      
      <div className="ai-section">
        <h4>Blockchain Intelligence</h4>
        <p>{aiInsights.blockchainAnalysis}</p>
      </div>
      
      <div className="ai-section">
        <h4>AI Reasoning</h4>
        <p>{aiInsights.reasoning}</p>
      </div>
    </div>
  )
}

function BlockchainInsights({ insights }: { insights: NonNullable<TradeAnalysis['blockchainInsights']> }) {
  return (
    <div className="blockchain-insights">
      <h3>🤖 AI Blockchain Analysis</h3>
      
      {insights.whaleActivity.length > 0 && (
        <div className="insight-section">
          <h4>Whale Activity</h4>
          <ul>
            {insights.whaleActivity.map((activity, index) => (
              <li key={index} className="blockchain-insight">{activity}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.volumeAnalysis.length > 0 && (
        <div className="insight-section">
          <h4>Volume Analysis</h4>
          <ul>
            {insights.volumeAnalysis.map((volume, index) => (
              <li key={index} className="blockchain-insight">{volume}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.liquidityFlow.length > 0 && (
        <div className="insight-section">
          <h4>Liquidity Flow</h4>
          <ul>
            {insights.liquidityFlow.map((flow, index) => (
              <li key={index} className="blockchain-insight">{flow}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}