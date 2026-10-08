import type React from 'react'

export const MenuHeader: React.FC = () => {
  return (
    <header className="relative w-full flex items-center justify-between py-2 px-4 border-b border-amber-900/40 bg-slate-950/90 backdrop-blur-md shrink-0">
      {/* Left: Jungle Gaming Logo Asset */}
      <div className="flex items-center gap-3">
        <img
          src="/assets/logo_jungle_gaming.svg"
          alt="Jungle Gaming Logo"
          className="h-7 sm:h-8 w-auto object-contain"
        />
        <div className="hidden sm:flex flex-col">
          <span className="text-secondary font-sans font-black text-xs uppercase tracking-widest leading-none">
            Pirate Battle
          </span>
          <span className="text-[10px] text-secondary/70 font-sans">Naval Warfare 2D</span>
        </div>
      </div>

      {/* Center: Game Title Logo PNG Asset */}
      <div className="flex items-center justify-center flex-1 max-w-xs sm:max-w-md">
        <img
          src="/assets/png/default/ui/menu/title_pirate_battle.png"
          alt="Pirate Battle"
          className="h-10 sm:h-14 w-auto object-contain"
        />
      </div>

      {/* Right Spacer */}
      <div className="w-8 sm:w-16" />
    </header>
  )
}
