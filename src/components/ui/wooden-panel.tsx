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
        'relative w-full mx-auto flex flex-col justify-between p-6 sm:p-8 text-[#d5c4a1] font-sans overflow-hidden',
        maxWidth,
        className,
      )}
    >
      {/* Background Frame Asset */}
      <img
        src="/assets/png/default/ui/menu/panel_menu.png"
        alt="Panel Frame"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
      />

      {/* Content Container Inside Frame */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center text-center">
        {children}
      </div>
    </div>
  )
}
