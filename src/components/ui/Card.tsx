import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  hover?: boolean
  className?: string
}

export function Card({ children, hover = true, className, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      className={cn(
        'rounded-2xl border border-border bg-bg-card p-5 transition-colors',
        hover && 'hover:bg-bg-card-hover hover:border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
