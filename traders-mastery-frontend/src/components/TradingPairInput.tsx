import React, { useState, useEffect, useRef } from 'react'
import { pairValidationService, type ValidationResult } from '../services/pairValidation'
import '../styles/trading-pair-input.css'

interface TradingPairInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (result: ValidationResult | null) => void
  placeholder?: string
  required?: boolean
}

export function TradingPairInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "e.g., BTC/USDT, ETH/BTC",
  required = false
}: TradingPairInputProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced validation
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    if (!value.trim()) {
      setValidationResult(null)
      setIsValidating(false)
      onValidationChange?.(null)
      return
    }

    setIsValidating(true)
    
    validationTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await pairValidationService.validatePair(value)
        setValidationResult(result)
        onValidationChange?.(result)
        
        // Update suggestions
        if (!result.isValid && result.suggestions) {
          setSuggestions(result.suggestions)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error('Validation error:', error)
        setValidationResult({
          isValid: false,
          error: 'Validation failed. Please try again.'
        })
      } finally {
        setIsValidating(false)
      }
    }, 500) // 500ms debounce

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [value, onValidationChange])

  // Show popular pairs when focused and empty
  const handleFocus = () => {
    if (!value.trim()) {
      setSuggestions(pairValidationService.getPopularPairs())
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    suggestionTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }, 200)
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setShowSuggestions(true)
    setHighlightedIndex(-1)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        if (highlightedIndex >= 0) {
          e.preventDefault()
          handleSuggestionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const getInputClassName = () => {
    let className = 'trading-pair-input'
    
    if (isValidating) {
      className += ' validating'
    } else if (validationResult) {
      className += validationResult.isValid ? ' valid' : ' invalid'
    }
    
    return className
  }

  return (
    <div className="trading-pair-container">
      <div className="form-group">
        <label htmlFor="tradingPair">
          Trading Pair {required && '*'}
        </label>
        
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            id="tradingPair"
            className={getInputClassName()}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            required={required}
            autoComplete="off"
          />
          
          <div className="input-indicators">
            {isValidating && (
              <div className="validation-spinner" title="Validating...">
                ⟳
              </div>
            )}
            
            {validationResult?.isValid && (
              <div className="validation-success" title="Valid trading pair">
                ✓
              </div>
            )}
            
            {validationResult && !validationResult.isValid && (
              <div className="validation-error" title={validationResult.error}>
                ⚠
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {!value.trim() && (
                <div className="suggestions-header">Popular Pairs</div>
              )}
              
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="pair-symbol">{suggestion}</span>
                  {validationResult?.pair?.symbol === suggestion && (
                    <span className="pair-price">
                      ${validationResult.pair.price?.toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Validation Messages */}
        {validationResult && (
          <div className="validation-message">
            {validationResult.isValid ? (
              <div className="success-message">
                <span className="message-icon">✓</span>
                <span>
                  {validationResult.pair?.baseAsset}/{validationResult.pair?.quoteAsset} 
                  {validationResult.pair?.price && ` - $${validationResult.pair.price.toFixed(2)}`}
                  {validationResult.pair?.priceChangePercent && (
                    <span className={validationResult.pair.priceChangePercent >= 0 ? 'positive' : 'negative'}>
                      {' '}({validationResult.pair.priceChangePercent > 0 ? '+' : ''}{validationResult.pair.priceChangePercent.toFixed(2)}%)
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="error-message">
                <span className="message-icon">⚠</span>
                <span>{validationResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}