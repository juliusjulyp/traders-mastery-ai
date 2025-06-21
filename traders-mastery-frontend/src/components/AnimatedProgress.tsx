import React, { useEffect, useState } from 'react'
import '../styles/progress.css'

interface AnimatedProgressProps {
  value: number
  max?: number
  label?: string
  color?: 'green' | 'blue' | 'orange' | 'red'
  size?: 'small' | 'medium' | 'large'
  showPercentage?: boolean
  animate?: boolean
  duration?: number
  striped?: boolean
  glowing?: boolean
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  label,
  color = 'green',
  size = 'medium',
  showPercentage = true,
  animate = true,
  duration = 1000,
  striped = false,
  glowing = false
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(percentage)
      return
    }

    const startTime = Date.now()
    const startValue = animatedValue

    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (percentage - startValue) * easedProgress
      
      setAnimatedValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animateProgress)
      }
    }
    
    requestAnimationFrame(animateProgress)
  }, [percentage, animate, duration, animatedValue])

  return (
    <div className={`animated-progress ${size}`}>
      {label && (
        <div className="progress-header">
          <span className="progress-label">{label}</span>
          {showPercentage && (
            <span className="progress-percentage">
              {Math.round(animatedValue)}%
            </span>
          )}
        </div>
      )}
      
      <div className="progress-container">
        <div 
          className={`progress-bar ${color} ${striped ? 'striped' : ''} ${glowing ? 'glowing' : ''}`}
          style={{ 
            width: `${animatedValue}%`,
            transition: animate ? 'none' : 'width 0.3s ease'
          }}
        />
        {striped && <div className="progress-stripes" />}
      </div>
    </div>
  )
}

// Circular progress component
export const CircularProgress: React.FC<{
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: 'green' | 'blue' | 'orange' | 'red'
  showValue?: boolean
  animate?: boolean
}> = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = 'green',
  showValue = true,
  animate = true
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(percentage)
      return
    }

    const startTime = Date.now()
    const duration = 1500

    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setAnimatedValue(percentage * easedProgress)
      
      if (progress < 1) {
        requestAnimationFrame(animateProgress)
      }
    }
    
    requestAnimationFrame(animateProgress)
  }, [percentage, animate])

  const colors = {
    green: 'var(--secondary-green)',
    blue: 'var(--accent-blue)',
    orange: 'var(--warning-orange)',
    red: 'var(--error-red)'
  }

  return (
    <div className="circular-progress">
      <svg width={size} height={size} className="circular-progress-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-circle"
          style={{
            filter: `drop-shadow(0 0 6px ${colors[color]}40)`
          }}
        />
      </svg>
      
      {showValue && (
        <div className="circular-progress-text">
          <span className="progress-value">{Math.round(animatedValue)}</span>
          <span className="progress-unit">%</span>
        </div>
      )}
    </div>
  )
}

// Analysis step progress component
export const AnalysisProgress: React.FC<{
  steps: string[]
  currentStep: number
  animate?: boolean
}> = ({ steps, currentStep, animate = true }) => {
  return (
    <div className="analysis-progress">
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`progress-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
          >
            <div className="step-indicator">
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div className="step-label">{step}</div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${index < currentStep ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>
      
      <div className="overall-progress">
        <AnimatedProgress
          value={(currentStep + 1) / steps.length * 100}
          color="blue"
          size="small"
          animate={animate}
          striped
          glowing
        />
      </div>
    </div>
  )
}

// Multi-segment progress bar
export const MultiProgress: React.FC<{
  segments: Array<{
    value: number
    color: 'green' | 'blue' | 'orange' | 'red'
    label: string
  }>
  total: number
  animate?: boolean
}> = ({ segments, total, animate = true }) => {
  const [animatedSegments, setAnimatedSegments] = useState(segments.map(() => 0))

  useEffect(() => {
    if (!animate) {
      setAnimatedSegments(segments.map(s => s.value))
      return
    }

    const startTime = Date.now()
    const duration = 1200

    const animateSegments = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      setAnimatedSegments(segments.map(segment => 
        segment.value * easedProgress
      ))
      
      if (progress < 1) {
        requestAnimationFrame(animateSegments)
      }
    }
    
    requestAnimationFrame(animateSegments)
  }, [segments, animate])

  return (
    <div className="multi-progress">
      <div className="multi-progress-bar">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`progress-segment ${segment.color}`}
            style={{
              width: `${(animatedSegments[index] / total) * 100}%`
            }}
          />
        ))}
      </div>
      
      <div className="progress-legend">
        {segments.map((segment, index) => (
          <div key={index} className="legend-item">
            <div className={`legend-color ${segment.color}`} />
            <span className="legend-label">{segment.label}</span>
            <span className="legend-value">
              {Math.round(animatedSegments[index])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}