import { motion } from 'framer-motion'
import { Hourglass } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-6 rounded-full bg-amber-500/10 p-5">
        <Hourglass className="h-10 w-10 text-amber-500/60" />
      </div>
      <h3 className="text-lg font-medium text-text">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>
      {action && (
        <Button variant="primary" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
