import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Global Error Boundary Component
 * Catches React component errors and prevents app crash
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 max-w-md border-red-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-400" />
              <h1 className="text-xl font-bold text-white">Oops! Something went wrong</h1>
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Toast Notification System
 */
const toastStore = new Set()

export function showToast(message, type = 'info', duration = 3000) {
  const id = `toast_${Date.now()}`
  const toast = { id, message, type, duration }
  
  toastStore.add(toast)
  
  // Trigger re-render in Toast container
  window.dispatchEvent(new CustomEvent('toast', { detail: toast }))
  
  // Auto-remove after duration
  setTimeout(() => {
    toastStore.delete(toast)
    window.dispatchEvent(new CustomEvent('toast-remove', { detail: { id } }))
  }, duration)
  
  return id
}

export const Toast = ({ id, message, type, onClose }) => {
  const colors = {
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300'
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'ⓘ'
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`${colors[type]} border rounded-lg p-4 flex items-center justify-between gap-3 min-w-80`}
    >
      <span className="font-semibold">{icons[type]} {message}</span>
      <button onClick={onClose} className="text-current hover:opacity-70">
        <X size={18} />
      </button>
    </motion.div>
  )
}

export const ToastContainer = () => {
  const [toasts, setToasts] = React.useState([])

  React.useEffect(() => {
    const handleToast = (e) => {
      const toast = e.detail
      setToasts(prev => [...prev, toast])
    }

    const handleRemove = (e) => {
      const { id } = e.detail
      setToasts(prev => prev.filter(t => t.id !== id))
    }

    window.addEventListener('toast', handleToast)
    window.addEventListener('toast-remove', handleRemove)

    return () => {
      window.removeEventListener('toast', handleToast)
      window.removeEventListener('toast-remove', handleRemove)
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id))
            toastStore.delete(toast)
          }}
        />
      ))}
    </div>
  )
}
