import React from 'react'
import { clsx } from 'clsx'

const variants = {
  brand:   'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  gray:    'badge-gray',
}

export default function Badge({ children, variant = 'gray', className }) {
  return (
    <span className={clsx(variants[variant], className)}>
      {children}
    </span>
  )
}

export function DifficultyBadge({ difficulty }) {
  const map = {
    easy:   { variant: 'success', label: 'Easy' },
    medium: { variant: 'warning', label: 'Medium' },
    hard:   { variant: 'danger',  label: 'Hard' },
  }
  const { variant, label } = map[difficulty?.toLowerCase()] ?? map.medium
  return <Badge variant={variant}>{label}</Badge>
}

export function StatusBadge({ status }) {
  const map = {
    pending:     { variant: 'gray',    label: 'Pending' },
    in_progress: { variant: 'brand',   label: 'In Progress' },
    completed:   { variant: 'success', label: 'Completed' },
  }
  const { variant, label } = map[status] ?? map.pending
  return <Badge variant={variant}>{label}</Badge>
}

export function ScoreBadge({ score }) {
  const variant = score >= 7.5 ? 'success' : score >= 5 ? 'warning' : 'danger'
  return (
    <Badge variant={variant}>
      {score?.toFixed(1)}/10
    </Badge>
  )
}
