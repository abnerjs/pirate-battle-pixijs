import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-amber-500/30 bg-amber-500/10 text-[#d5c4a1] font-bold',
        secondary: 'border-slate-700 bg-slate-800 text-[#d5c4a1]',
        destructive: 'border-red-500/30 bg-red-500/10 text-red-400 font-bold',
        outline: 'text-[#d5c4a1] border-slate-700',
        gold: 'border-amber-400/50 bg-gradient-to-r from-amber-600/30 to-yellow-500/30 text-[#d5c4a1] font-extrabold',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
