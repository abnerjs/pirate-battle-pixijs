import type React from 'react'
import { cn } from '@/lib/utils'

interface CounterPanelProps {
  icon: string
  value: string | number
  title?: string
  className?: string
}

export const CounterPanel: React.FC<CounterPanelProps> = ({ icon, value, title, className }) => {
  return (
    <div
      title={title}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 py-2 px-4 select-none min-w-[100px] sm:min-w-[116px] h-11',
        className,
      )}
    >
      {/* 9-Slice Background Frame using counter_panel.png */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '14px 20px',
          borderImageSource: "url('/assets/png/default/ui/hud/counter_panel.png')",
          borderImageSlice: '16 24 16 24 fill',
          borderImageRepeat: 'stretch',
        }}
      />
      <img
        src={icon}
        alt=""
        className="relative z-10 w-5 h-5 object-contain shrink-0 pointer-events-none"
      />
      <span className="relative z-10 font-mono font-black text-secondary text-base sm:text-lg tracking-wider">
        {value}
      </span>
    </div>
  )
}
