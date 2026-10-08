import type React from 'react'
import { soundManager } from '@/lib/sound-manager'
import { cn } from '@/lib/utils'

interface WoodenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'round'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const WoodenButton: React.FC<WoodenButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  onMouseEnter,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundManager.playClick()
    if (onClick) onClick(e)
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundManager.playHover()
    if (onMouseEnter) onMouseEnter(e)
  }

  if (variant === 'round') {
    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 disabled:pointer-events-none focus:outline-none',
          size === 'sm' ? 'p-2 text-xs' : 'p-3 text-sm',
          className,
        )}
        {...props}
      >
        <img
          src="/assets/png/default/ui/controls/button_round_normal.png"
          alt="button"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        <span className="relative z-10 text-secondary font-bold flex items-center justify-center">
          {children}
        </span>
      </button>
    )
  }

  const bgImage =
    variant === 'primary'
      ? '/assets/png/default/ui/menu/button_primary_normal.png'
      : '/assets/png/default/ui/menu/button_secondary_normal.png'

  const sizeClasses =
    size === 'sm'
      ? 'py-2 px-4 text-xs'
      : size === 'lg'
        ? 'py-4 px-8 text-base font-black'
        : 'py-3 px-6 text-sm font-extrabold'

  // Primary button: text-primary (#382b1f)
  // Secondary button: text-secondary (#d5c4a1)
  const textColors = variant === 'primary' ? 'text-primary font-black' : 'text-secondary font-black'

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'relative inline-flex items-center justify-center font-sans uppercase tracking-widest transition-opacity hover:opacity-95 active:opacity-85 disabled:opacity-50 disabled:pointer-events-none focus:outline-none select-none min-w-[140px]',
        sizeClasses,
        className,
      )}
      {...props}
    >
      <img
        src={bgImage}
        alt="button frame"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
      />
      <span
        className={cn(
          'relative z-10 text-center flex items-center justify-center gap-2 font-black',
          textColors,
        )}
      >
        {children}
      </span>
    </button>
  )
}
