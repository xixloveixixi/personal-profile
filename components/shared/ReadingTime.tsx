interface ReadingTimeProps {
  minutes: number
  className?: string
}

export function ReadingTime({ minutes, className = '' }: ReadingTimeProps) {
  return (
    <span className={`text-sm text-gray-500 ${className}`}>
      {minutes} {minutes === 1 ? 'min' : 'mins'} read
    </span>
  )
}

