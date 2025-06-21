import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'matrix' | 'trading-floor' | 'minimalist' | 'cyberpunk' | 'golden'
export type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeName
  mode: ThemeMode
  setTheme: (theme: ThemeName) => void
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeName
  defaultMode?: ThemeMode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'matrix',
  defaultMode = 'dark'
}) => {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme)
  const [mode, setModeState] = useState<ThemeMode>(defaultMode)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('traders-mastery-theme') as ThemeName
    const savedMode = localStorage.getItem('traders-mastery-mode') as ThemeMode
    
    if (savedTheme) {
      setThemeState(savedTheme)
    }
    
    if (savedMode) {
      setModeState(savedMode)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Add theme switching class to prevent transition flash
    root.classList.add('theme-switching')
    
    // Set theme attributes
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-mode', mode)
    
    // Remove theme switching class after a brief delay
    setTimeout(() => {
      root.classList.remove('theme-switching')
    }, 100)
    
    // Save to localStorage
    localStorage.setItem('traders-mastery-theme', theme)
    localStorage.setItem('traders-mastery-mode', mode)
  }, [theme, mode])

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
  }

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
  }

  const toggleMode = () => {
    setModeState(mode === 'light' ? 'dark' : 'light')
  }

  const value = {
    theme,
    mode,
    setTheme,
    setMode,
    toggleMode
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme selector component
export const ThemeSelector: React.FC<{
  showModeToggle?: boolean
  compact?: boolean
}> = ({ 
  showModeToggle = true, 
  compact = false 
}) => {
  const { theme, mode, setTheme, toggleMode } = useTheme()

  const themes: Array<{ name: ThemeName; label: string; description: string }> = [
    { 
      name: 'matrix', 
      label: 'Matrix', 
      description: 'Classic green-on-black terminal theme' 
    },
    { 
      name: 'trading-floor', 
      label: 'Trading Floor', 
      description: 'Professional red/green trading colors' 
    },
    { 
      name: 'minimalist', 
      label: 'Minimalist', 
      description: 'Clean and modern design' 
    },
    { 
      name: 'cyberpunk', 
      label: 'Cyberpunk', 
      description: 'Neon colors and futuristic vibes' 
    },
    { 
      name: 'golden', 
      label: 'Golden', 
      description: 'Luxury gold and black theme' 
    }
  ]

  if (compact) {
    return (
      <div className="theme-selector compact">
        {themes.map((themeOption) => (
          <button
            key={themeOption.name}
            className={`theme-option ${themeOption.name} ${theme === themeOption.name ? 'active' : ''}`}
            onClick={() => setTheme(themeOption.name)}
            title={themeOption.description}
          />
        ))}
        {showModeToggle && (
          <button
            className="mode-toggle"
            onClick={toggleMode}
            title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          >
            {mode === 'light' ? '🌙' : '☀️'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="theme-selector-panel">
      <h3>Choose Theme</h3>
      
      <div className="theme-grid">
        {themes.map((themeOption) => (
          <div
            key={themeOption.name}
            className={`theme-card ${theme === themeOption.name ? 'active' : ''}`}
            onClick={() => setTheme(themeOption.name)}
          >
            <div className={`theme-preview ${themeOption.name}`} />
            <div className="theme-info">
              <h4>{themeOption.label}</h4>
              <p>{themeOption.description}</p>
            </div>
          </div>
        ))}
      </div>

      {showModeToggle && (
        <div className="mode-toggle-section">
          <label className="mode-toggle-label">
            <input
              type="checkbox"
              checked={mode === 'dark'}
              onChange={toggleMode}
              className="mode-toggle-input"
            />
            <span className="mode-toggle-slider">
              <span className="mode-toggle-icon">
                {mode === 'light' ? '☀️' : '🌙'}
              </span>
            </span>
            <span className="mode-toggle-text">
              {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

// Hook to get theme-aware colors
export const useThemeColors = () => {
  const { theme } = useTheme()
  
  const getThemeColors = () => {
    const style = getComputedStyle(document.documentElement)
    
    return {
      primary: style.getPropertyValue('--primary-green').trim(),
      secondary: style.getPropertyValue('--secondary-green').trim(),
      accent: style.getPropertyValue('--accent-blue').trim(),
      warning: style.getPropertyValue('--warning-orange').trim(),
      error: style.getPropertyValue('--error-red').trim(),
      bgPrimary: style.getPropertyValue('--bg-primary').trim(),
      bgSecondary: style.getPropertyValue('--bg-secondary').trim(),
      bgTertiary: style.getPropertyValue('--bg-tertiary').trim(),
      textPrimary: style.getPropertyValue('--text-primary').trim(),
      textSecondary: style.getPropertyValue('--text-secondary').trim(),
      textMuted: style.getPropertyValue('--text-muted').trim(),
    }
  }

  return { getThemeColors, currentTheme: theme }
}