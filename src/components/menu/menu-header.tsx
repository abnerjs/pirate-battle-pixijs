import { Volume2, VolumeX } from 'lucide-react'
import type React from 'react'
import { Button } from '@/components/ui/button'

interface MenuHeaderProps {
  isMuted: boolean
  toggleMute: () => void
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ isMuted, toggleMute }) => {
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

      {/* Right: Sound Control Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMute}
          className="h-8 px-2.5 text-xs border-amber-900/60 bg-slate-900 text-secondary hover:bg-amber-950/50"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-red-400 mr-1" />
          ) : (
            <Volume2 className="h-4 w-4 text-secondary mr-1" />
          )}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
        </Button>
      </div>
    </header>
  )
}
