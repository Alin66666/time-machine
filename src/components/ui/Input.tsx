import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text',
            'placeholder:text-text-muted/50',
            'focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20',
            'transition-colors',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'
