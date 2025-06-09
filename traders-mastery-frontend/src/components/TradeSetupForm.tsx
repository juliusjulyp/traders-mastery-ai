// Trade Setup Form Component - Optimized & Reusable

interface TradeSetupFormData {
  tradingPair: string
  entryPrice: string
  entryReasoning: string
  takeProfitPrice: string
  takeProfitReasoning: string
  stopLossPrice: string
  stopLossReasoning: string
  positionSize: string
  timeFrame: string
  leverage: string
}

interface TradeSetupFormProps {
  tradeSetup: TradeSetupFormData
  onInputChange: (field: keyof TradeSetupFormData, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  errors: string[]
  isAnalyzing: boolean
  analysisStep: string
}

export function TradeSetupForm({
  tradeSetup,
  onInputChange,
  onSubmit,
  errors,
  isAnalyzing,
  analysisStep
}: TradeSetupFormProps) {
  return (
    <form onSubmit={onSubmit} className="trade-form">
      <h2>Trade Setup Analysis</h2>
      
      <FormInput
        id="tradingPair"
        label="Trading Pair"
        type="text"
        placeholder="e.g., BTC/USDT, ETH/BTC"
        value={tradeSetup.tradingPair}
        onChange={(value) => onInputChange('tradingPair', value)}
        required
      />

      <div className="form-row">
        <FormInput
          id="entryPrice"
          label="Entry Price"
          type="number"
          placeholder="Enter price"
          value={tradeSetup.entryPrice}
          onChange={(value) => onInputChange('entryPrice', value)}
          required
        />
        <FormInput
          id="positionSize"
          label="Position Size (USDT)"
          type="number"
          placeholder="e.g., 1000"
          value={tradeSetup.positionSize}
          onChange={(value) => onInputChange('positionSize', value)}
          required
        />
      </div>

      <FormTextarea
        id="entryReasoning"
        label="Entry Reasoning"
        placeholder="Explain why you believe this is a good entry point..."
        value={tradeSetup.entryReasoning}
        onChange={(value) => onInputChange('entryReasoning', value)}
        required
      />

      <div className="form-row">
        <FormInput
          id="takeProfitPrice"
          label="Take Profit Price"
          type="number"
          placeholder="Target exit price"
          value={tradeSetup.takeProfitPrice}
          onChange={(value) => onInputChange('takeProfitPrice', value)}
          required
        />
        <FormInput
          id="stopLossPrice"
          label="Stop Loss Price"
          type="number"
          placeholder="Risk exit price"
          value={tradeSetup.stopLossPrice}
          onChange={(value) => onInputChange('stopLossPrice', value)}
          required
        />
      </div>

      <div className="form-row">
        <FormSelect
          id="timeFrame"
          label="Time Frame"
          value={tradeSetup.timeFrame}
          onChange={(value) => onInputChange('timeFrame', value)}
          options={[
            { value: '', label: 'Select time frame' },
            { value: 'scalping', label: 'Scalping (1m-15m)' },
            { value: 'day-trading', label: 'Day Trading (15m-4h)' },
            { value: 'intraday', label: 'Intraday (1h-1d)' },
            { value: 'swing', label: 'Swing Trading (1d-1w)' }
          ]}
          allowCustom
          customPlaceholder="Enter custom time frame (e.g., 2h-12h, 3d-2w)"
          required
        />
        <FormSelect
          id="leverage"
          label="Leverage"
          value={tradeSetup.leverage}
          onChange={(value) => onInputChange('leverage', value)}
          options={[
            { value: '', label: 'Select leverage' },
            { value: 'none', label: 'No Leverage (1x)' },
            { value: '2x', label: '2x Leverage' },
            { value: '3x', label: '3x Leverage' },
            { value: '5x', label: '5x Leverage' },
            { value: '10x', label: '10x Leverage' },
            { value: '20x', label: '20x Leverage' },
            { value: '50x', label: '50x Leverage' },
            { value: '100x', label: '100x Leverage' }
          ]}
          allowCustom
          customPlaceholder="Enter custom leverage (e.g., 15)"
          customType="number"
          customSuffix="x"
          required
        />
      </div>

      <FormTextarea
        id="takeProfitReasoning"
        label="Take Profit Reasoning"
        placeholder="Analysis behind your profit target..."
        value={tradeSetup.takeProfitReasoning}
        onChange={(value) => onInputChange('takeProfitReasoning', value)}
        required
      />

      <FormTextarea
        id="stopLossReasoning"
        label="Stop Loss Reasoning"
        placeholder="Logic behind your stop loss level..."
        value={tradeSetup.stopLossReasoning}
        onChange={(value) => onInputChange('stopLossReasoning', value)}
        required
      />

      <ErrorDisplay errors={errors} />

      <button type="submit" className="analyze-btn" disabled={isAnalyzing}>
        {isAnalyzing ? (analysisStep || 'Analyzing...') : 'Analyze Trade Setup'}
      </button>
    </form>
  )
}

// Reusable Form Components
interface FormInputProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

function FormInput({ id, label, type = 'text', placeholder, value, onChange, required }: FormInputProps) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label} {required && '*'}
      </label>
      <input
        type={type}
        id={id}
        step={type === 'number' ? 'any' : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}

interface FormTextareaProps {
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  rows?: number
}

function FormTextarea({ id, label, placeholder, value, onChange, required, rows = 3 }: FormTextareaProps) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label} {required && '*'}
      </label>
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
      />
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  allowCustom?: boolean
  customPlaceholder?: string
  customType?: string
  customSuffix?: string
  required?: boolean
}

function FormSelect({ 
  id, 
  label, 
  value, 
  onChange, 
  options, 
  allowCustom, 
  customPlaceholder, 
  customType = 'text',
  customSuffix = '',
  required 
}: FormSelectProps) {
  const isCustom = value === 'custom' || value.startsWith('custom-')
  
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label} {required && '*'}
      </label>
      <select
        id={id}
        value={isCustom ? 'custom' : value}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            onChange('custom')
          } else {
            onChange(e.target.value)
          }
        }}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {allowCustom && <option value="custom">Custom {label}</option>}
      </select>
      
      {isCustom && allowCustom && (
        <input
          type={customType}
          placeholder={customPlaceholder}
          value={value.startsWith('custom-') ? value.replace('custom-', '').replace(customSuffix, '') : ''}
          onChange={(e) => {
            const customValue = e.target.value
            if (customValue) {
              onChange(`custom-${customValue}${customSuffix}`)
            } else {
              onChange('custom')
            }
          }}
          min={customType === 'number' ? "1" : undefined}
          max={customType === 'number' ? "1000" : undefined}
          step={customType === 'number' ? "0.1" : undefined}
          className={`custom-${id}-input`}
          required={required}
        />
      )}
    </div>
  )
}

function ErrorDisplay({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null

  return (
    <div className="error-container">
      <h4>Please fix the following errors:</h4>
      <ul>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )
}

export type { TradeSetupFormData }