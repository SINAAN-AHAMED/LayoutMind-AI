import * as React from 'react'
import { cn } from '../../lib/cn'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-none rounded-xl bg-text-primary/5 dark:bg-white/5 border border-text-primary/10 dark:border-white/10 px-4 py-3 text-text-primary dark:text-white/90 placeholder:text-text-secondary/50 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-primary/50 transition-colors',
        className,
      )}
      {...props}
    />
  )
})

