import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-[#382b1f] font-extrabold hover:from-amber-500 hover:to-yellow-400 border border-amber-400/50',
        destructive:
          'bg-gradient-to-r from-red-700 to-rose-600 text-white hover:from-red-600 hover:to-rose-500 border border-red-500/40',
        outline:
          'border border-amber-600/40 bg-slate-900/80 text-[#d5c4a1] hover:bg-amber-950/50 hover:text-[#d5c4a1] hover:border-amber-500/60 backdrop-blur-sm',
        secondary: 'bg-slate-800 text-[#d5c4a1] hover:bg-slate-700 border border-slate-700',
        ghost: 'text-[#d5c4a1] hover:bg-amber-950/30 hover:text-[#d5c4a1] font-medium',
        link: 'text-[#d5c4a1] underline-offset-4 hover:underline',
        pirate:
          'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-[#382b1f] font-extrabold uppercase tracking-wider border-2 border-yellow-300/80 hover:from-amber-400 hover:to-amber-600 transition-all duration-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base tracking-wide',
        xl: 'h-14 rounded-xl px-10 text-lg tracking-wider font-extrabold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
