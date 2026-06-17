import React, { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(function Input(
  { label, error, icon, className, containerClassName, ...props },
  ref
) {
  return (
    <div className={clsx('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            'input-field',
            icon && 'pl-10',
            error && 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  )
})

export default Input

export function Textarea({ label, error, className, containerClassName, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1', containerClassName)}>
      {label && <label className="input-label">{label}</label>}
      <textarea
        className={clsx(
          'input-field resize-none',
          error && 'border-red-500/60',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className, containerClassName, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1', containerClassName)}>
      {label && <label className="input-label">{label}</label>}
      <select
        className={clsx(
          'input-field',
          error && 'border-red-500/60',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}
