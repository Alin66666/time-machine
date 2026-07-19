import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm text-text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text',
            'placeholder:text-text-muted/50',
            'focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20',
            'transition-colors resize-none',
            className
          )}
          rows={3}
          {...props}
        />
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
