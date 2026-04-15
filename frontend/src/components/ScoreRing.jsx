import React, { useEffect, useRef, useState } from 'react'

/**
 * Animated SVG score ring with counter animation
 * Props: score (0-100), size, strokeWidth, color, label, showValue
 */
export default function ScoreRing({
  score = 0,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  trackColor = 'rgba(255,255,255,0.06)',
  label = '',
  showValue = true,
  animate = true,
  className = ''
}) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score)
  const [progress, setProgress] = useState(animate ? 0 : score)
  const hasAnimated = useRef(false)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    if (!animate || hasAnimated.current) return
    hasAnimated.current = true

    const duration = 1200
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
      const current = Math.round(ease * score)
      setDisplayed(current)
      setProgress(ease * score)
      if (t < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [score, animate])

  const getColor = (s) => {
    if (s >= 80) return '#34d399'
    if (s >= 65) return '#6366f1'
    if (s >= 50) return '#fbbf24'
    return '#f87171'
  }

  const finalColor = color === 'auto' ? getColor(score) : color

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={finalColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-animate"
          style={{ filter: `drop-shadow(0 0 6px ${finalColor}60)` }}
        />
      </svg>

      {showValue && (
        <div className="text-center -mt-[calc(100%+8px)] absolute" style={{ width: size, marginTop: -(size + 8) }}>
          {/* Inline positioning via parent relative */}
        </div>
      )}

      {/* Center label — inside the ring */}
      {showValue && (
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{ width: size, height: size, marginTop: -size }}
        >
          <span className="font-mono font-semibold text-white" style={{ fontSize: size * 0.22 }}>
            {displayed}
          </span>
          {size > 80 && (
            <span className="text-slate-500" style={{ fontSize: size * 0.1 }}>/ 100</span>
          )}
        </div>
      )}

      {label && (
        <span className="text-xs text-slate-400 text-center max-w-[80px] leading-tight">{label}</span>
      )}
    </div>
  )
}

/**
 * Simpler inline score display with ring
 */
export function ScoreRingInline({ score = 0, label = '', size = 72, className = '' }) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <ScoreRing score={score} size={size} strokeWidth={6} color="auto" label={label} showValue />
    </div>
  )
}
