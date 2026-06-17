import React from 'react'
import { clsx } from 'clsx'

export default function ProgressBar({ value = 0, max = 100, label, showValue = false, size = 'md', color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  const getColor = () => {
    if (color) return color
    if (pct >= 75) return 'from-emerald-500 to-emerald-400'
    if (pct >= 50) return 'from-amber-500 to-amber-400'
    return 'from-red-500 to-red-400'
  }

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-white">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={clsx('progress-bar', heights[size])}>
        <div
          className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-700', getColor())}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ScoreBar({ label, score, max = 10 }) {
  const pct = (score / max) * 100
  const color = pct >= 75 ? 'from-emerald-500 to-emerald-400'
    : pct >= 50 ? 'from-amber-500 to-amber-400'
    : 'from-red-500 to-red-400'

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold text-white">{score?.toFixed(1)}/10</span>
      </div>
      <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
