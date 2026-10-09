import type React from 'react'
import { soundManager } from '@/lib/sound-manager'
import { cn } from '@/lib/utils'

export interface RoundedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg'
  isPressed?: boolean
  children: React.ReactNode
}

export const RoundedButton: React.FC<RoundedButtonProps> = ({
  size = 'md',
  isPressed = false,
  className,
  children,
  onClick,
  onMouseEnter,
  disabled,
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

  const roundSize =
    size === 'sm'
      ? 'w-7 h-7 p-1 text-xs'
      : size === 'lg'
        ? 'w-11 h-11 p-2 text-sm'
        : 'w-9 h-9 p-1.5 text-sm'

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      className={cn(
        'group relative inline-flex items-center justify-center font-sans focus:outline-none select-none shrink-0 transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100',
        roundSize,
        isPressed && 'scale-95',
        className,
      )}
      {...props}
    >
      {/* Normal State Image */}
      <img
        src="/assets/png/default/ui/controls/button_round_normal.png"
        alt=""
        className={cn(
          'absolute inset-0 w-full h-full object-contain pointer-events-none group-hover:hidden group-active:hidden group-disabled:block',
          isPressed && 'hidden',
        )}
      />
      {/* Hover State Image */}
      <img
        src="/assets/png/default/ui/controls/button_round_hover.png"
        alt=""
        className={cn(
          'absolute inset-0 w-full h-full object-contain pointer-events-none hidden group-hover:block group-active:hidden group-disabled:hidden',
          isPressed && '!hidden',
        )}
      />
      {/* Pressed State Image */}
      <img
        src="/assets/png/default/ui/controls/button_round_pressed.png"
        alt=""
        className={cn(
          'absolute inset-0 w-full h-full object-contain pointer-events-none hidden group-active:block group-disabled:hidden',
          isPressed && '!block',
        )}
      />
      <span className="relative z-10 text-secondary font-black flex items-center justify-center w-full h-full pointer-events-none">
        {children}
      </span>
    </button>
  )
}
