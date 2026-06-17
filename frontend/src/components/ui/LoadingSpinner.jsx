import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text, fullScreen = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-brand-500/10 animate-pulse" />
          </div>
          {text && <p className="text-slate-400 text-sm animate-pulse">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className={`${sizes[size]} animate-spin text-brand-400`} />
      {text && <span className="text-slate-400 text-sm">{text}</span>}
    </div>
  )
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-brand-500/10 animate-pulse" />
      </div>
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="glass p-5 space-y-3">
      <div className="h-4 w-1/3 rounded-lg shimmer bg-surface-600" />
      <div className="h-3 w-full rounded-lg shimmer bg-surface-600" />
      <div className="h-3 w-4/5 rounded-lg shimmer bg-surface-600" />
    </div>
  )
}
