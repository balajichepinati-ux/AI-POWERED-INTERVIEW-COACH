/**
 * Hook for monitoring Gemini API key status
 * Use this in your dashboard/settings to show API key health
 */

import { useState, useEffect } from 'react'
import GeminiService from '../lib/gemini'

export function useGeminiApiStatus() {
  const [stats, setStats] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Update stats every 5 seconds
  useEffect(() => {
    const updateStats = () => {
      try {
        const apiStats = GeminiService.getApiStats()
        setStats(apiStats)
        setIsReady(GeminiService.isReady())
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching API stats:', error)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const resetKey = (keyIndex) => {
    GeminiService.resetApiKey(keyIndex)
    // Update immediately
    const apiStats = GeminiService.getApiStats()
    setStats(apiStats)
  }

  const resetAllKeys = () => {
    GeminiService.resetAllApiKeys()
    // Update immediately
    const apiStats = GeminiService.getApiStats()
    setStats(apiStats)
  }

  return {
    stats,
    isReady,
    lastUpdate,
    resetKey,
    resetAllKeys,
    totalRequests: GeminiService.getTotalRequests(),
    totalErrors: GeminiService.getTotalErrors()
  }
}

/**
 * Simple status component to display API key health
 */
export function GeminiApiStatus() {
  const { stats, isReady, totalRequests, totalErrors, resetAllKeys } = useGeminiApiStatus()

  if (!stats) {
    return <div>Loading API status...</div>
  }

  const statusColor = isReady ? '#10b981' : '#ef4444'
  const statusText = isReady ? 'Ready' : 'All Keys Failed'

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        marginBottom: '16px'
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`
            }}
          />
          <span style={{ fontWeight: '600', color: '#f1f5f9' }}>
            Gemini API: {statusText}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.8)', marginBottom: '12px' }}>
        <div>
          Current Key: #{stats.currentKeyIndex + 1} / {stats.totalKeys}
        </div>
        <div>
          Failed Keys: {stats.failedKeysCount} / {stats.totalKeys}
        </div>
        <div>
          Total Requests: {totalRequests}
        </div>
        <div>
          Total Errors: {totalErrors}
        </div>
      </div>

      {stats.failedKeys.length > 0 && (
        <div style={{ fontSize: '12px', marginBottom: '12px' }}>
          <div style={{ color: '#f59e0b', marginBottom: '6px' }}>
            Failed Keys: {stats.failedKeys.map(i => i + 1).join(', ')}
          </div>
        </div>
      )}

      {!isReady && (
        <button
          onClick={resetAllKeys}
          style={{
            padding: '6px 12px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '6px',
            color: '#3b82f6',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.2)'
          }}
        >
          Reset All Keys
        </button>
      )}
    </div>
  )
}

export default useGeminiApiStatus
