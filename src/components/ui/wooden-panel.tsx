import type React from 'react'
import { cn } from '@/lib/utils'

interface WoodenPanelProps {
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

export const WoodenPanel: React.FC<WoodenPanelProps> = ({
  children,
  className,
  maxWidth = 'max-w-xl',
}) => {
  return (
    <div
      className={cn(
        'relative w-full mx-auto flex flex-col justify-between text-secondary font-sans',
        maxWidth,
        className,
      )}
    >
      {/* 9-Slice Background Frame Asset (Responsive borderWidth on mobile to eliminate huge lateral padding) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          borderStyle: 'solid',
          borderWidth: 'clamp(32px, 8vw, 112px)',
          borderImageSource: "url('/assets/png/default/ui/menu/panel_menu.png')",
          borderImageSlice: '112 fill',
          borderImageRepeat: 'stretch',
        }}
      />

      {/* Content Container Inside 9-Slice Frame */}
      <div className="relative z-10 w-full flex flex-col justify-between items-center text-center p-3 sm:p-8 space-y-3 sm:space-y-4">
        {children}
      </div>
    </div>
  )
}
