import { HTMLAttributes, ReactNode } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'outline'
}

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  const variants = {
    default:
      'border-transparent bg-primary-600 text-accent-light hover:bg-primary-600/90 shadow-md shadow-primary-600/30',
    secondary:
      'border-transparent bg-accent-pink text-primary-600 hover:bg-accent-pink/80',
    outline: 'border-primary-600 text-primary-600 bg-transparent hover:bg-accent-light/20',
  }

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

