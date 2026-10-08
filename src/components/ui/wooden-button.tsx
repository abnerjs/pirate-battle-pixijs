import type React from 'react'
import { RoundedButton } from '@/components/ui/rounded-button'
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
      <RoundedButton
        size={size}
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        {...props}
      >
        {children}
      </RoundedButton>
    )
  }

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
        'group relative inline-flex items-center justify-center font-sans uppercase tracking-widest focus:outline-none select-none min-w-[140px] disabled:pointer-events-none',
        sizeClasses,
        className,
      )}
      {...props}
    >
      {variant === 'primary' ? (
        <>
          {/* Primary Normal */}
          <div
            className="absolute inset-0 pointer-events-none z-0 group-hover:hidden group-active:hidden group-disabled:hidden"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_primary_normal.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
          {/* Primary Hover */}
          <div
            className="absolute inset-0 pointer-events-none z-0 hidden group-hover:block group-active:hidden group-disabled:hidden"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_primary_hover.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
          {/* Primary Pressed */}
          <div
            className="absolute inset-0 pointer-events-none z-0 hidden group-active:block group-disabled:hidden"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_primary_pressed.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
          {/* Primary Disabled */}
          <div
            className="absolute inset-0 pointer-events-none z-0 hidden group-disabled:block"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_primary_disabled.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
        </>
      ) : (
        <>
          {/* Secondary Normal */}
          <div
            className="absolute inset-0 pointer-events-none z-0 group-hover:hidden group-active:hidden group-disabled:hidden"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_secondary_normal.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
          {/* Secondary Hover & Pressed (both use pressed image) */}
          <div
            className="absolute inset-0 pointer-events-none z-0 hidden group-hover:block group-active:block group-disabled:hidden"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_secondary_pressed.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
          {/* Secondary Disabled */}
          <div
            className="absolute inset-0 pointer-events-none z-0 hidden group-disabled:block opacity-50"
            style={{
              borderStyle: 'solid',
              borderWidth: '16px 24px',
              borderImageSource: "url('/assets/png/default/ui/menu/button_secondary_normal.png')",
              borderImageSlice: '32 36 32 36 fill',
              borderImageRepeat: 'stretch',
            }}
          />
        </>
      )}
      <span
        className={cn(
          'relative z-10 text-center flex items-center justify-center gap-2 font-black group-disabled:opacity-50',
          textColors,
        )}
      >
        {children}
      </span>
    </button>
  )
}
