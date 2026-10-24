export function formatCurrency(value: number, compact = false) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: compact && value >= 100000 ? 'compact' : 'standard',
  }).format(value)
}

export function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(date)
}

export function formatPercentile(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)}%` : 'Unavailable'
}

export function riskTone(value: string) {
  const normalized = value.toLowerCase()
  return normalized === 'low' || normalized === 'safe' ? 'success' : normalized === 'high' ? 'danger' : 'amber'
}

export function getDistinct<T>(items: T[], getValue: (item: T) => string) {
  return [...new Set(items.map(getValue).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}
