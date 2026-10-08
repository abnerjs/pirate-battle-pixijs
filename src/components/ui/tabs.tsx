import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'
import { soundManager } from '@/lib/sound-manager'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-3 bg-transparent p-0 border-0',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, onClick, onMouseEnter, children, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundManager.playClick()
    if (onClick) onClick(e)
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundManager.playHover()
    if (onMouseEnter) onMouseEnter(e)
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'group relative inline-flex items-center justify-center font-sans uppercase tracking-widest focus:outline-none select-none py-2.5 px-6 text-xs font-black min-w-[130px] data-[state=active]:text-primary data-[state=inactive]:text-secondary disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      {/* Active Tab Background Wrapper (Primary) */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden group-data-[state=active]:block">
        {/* Active Normal */}
        <div
          className="absolute inset-0 group-hover:hidden group-active:hidden group-disabled:hidden"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_primary_normal.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
        {/* Active Hover */}
        <div
          className="absolute inset-0 hidden group-hover:block group-active:hidden group-disabled:hidden"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_primary_hover.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
        {/* Active Pressed */}
        <div
          className="absolute inset-0 hidden group-active:block group-disabled:hidden"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_primary_pressed.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
        {/* Active Disabled */}
        <div
          className="absolute inset-0 hidden group-disabled:block"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_primary_disabled.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
      </div>

      {/* Inactive Tab Background Wrapper (Secondary) */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden group-data-[state=inactive]:block">
        {/* Inactive Normal */}
        <div
          className="absolute inset-0 group-hover:hidden group-active:hidden group-disabled:hidden"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_secondary_normal.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
        {/* Inactive Hover & Pressed (both use pressed image) */}
        <div
          className="absolute inset-0 hidden group-hover:block group-active:block group-disabled:hidden"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_secondary_pressed.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
        {/* Inactive Disabled */}
        <div
          className="absolute inset-0 hidden group-disabled:block opacity-50"
          style={{
            borderStyle: 'solid',
            borderWidth: '10px 12px',
            borderImageSource: "url('/assets/png/default/ui/menu/button_secondary_normal.png')",
            borderImageSlice: '32 36 32 36 fill',
            borderImageRepeat: 'stretch',
          }}
        />
      </div>

      <span className="relative z-10 text-center flex items-center justify-center gap-2 font-black group-disabled:opacity-50">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
