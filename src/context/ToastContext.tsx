import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './toast-context'

type ToastTone = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; tone: ToastTone }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200)
  }, [])
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => (
          <div className={`toast toast-${item.tone}`} key={item.id} role="status">
            <span className="toast-mark">{item.tone === 'error' ? '!' : item.tone === 'success' ? 'OK' : 'i'}</span>
            {item.message}
            <button className="toast-close" type="button" onClick={() => setItems((all) => all.filter((entry) => entry.id !== item.id))} aria-label="Dismiss notification">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
    )
}
