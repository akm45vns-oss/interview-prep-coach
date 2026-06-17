import React from 'react'
import { clsx } from 'clsx'

export default function Card({ children, className, hover = false, glow = false, ...props }) {
  return (
    <div
      className={clsx(
        'glass p-5',
        hover && 'hover:border-brand-500/30 hover:shadow-brand cursor-pointer transition-all duration-300',
        glow && 'shadow-brand',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-base font-semibold text-white', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }) {
  return (
    <div className={clsx('text-slate-400 text-sm', className)}>
      {children}
    </div>
  )
}
