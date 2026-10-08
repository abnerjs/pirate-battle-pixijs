import type React from 'react'
import { useState } from 'react'
import { WoodenButton } from '@/components/ui/wooden-button'
import { WoodenPanel } from '@/components/ui/wooden-panel'
import { AVAILABLE_SHIPS, useOptionsStore } from '@/lib/options-store'
import { soundManager } from '@/lib/sound-manager'
import type { GameOptions } from '@/types/game'
import { CaptainsLog } from './captains-log'
import { OptionsScreen } from './options-screen'

interface MainMenuProps {
  onStartGame: (snapshotConfig: GameOptions) => void
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [currentView, setCurrentView] = useState<'menu' | 'options' | 'ranking' | 'history'>('menu')

  const { options, cycleSelectedShip, getSnapshot } = useOptionsStore()

  const handlePlayClick = () => {
    soundManager.playStart()
    const snapshot = getSnapshot()
    onStartGame(snapshot)
  }

  const handleShipClick = () => {
    soundManager.playClick()
    cycleSelectedShip()
  }

  const currentShip = options.selectedShip || 'ship_1.png'
  const currentShipNum = AVAILABLE_SHIPS.indexOf(currentShip) + 1

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans bg-slate-950 flex flex-col items-center justify-center">
      {/* 1. Base Layer: Scene Background Asset - ui_scene_background.png for a while */}
      <img
        src="/assets/ui_scene_background.png"
        alt="Scene Background"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      {/* 2. Black Modal Overlay Layer */}
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-10 pointer-events-none" />

      {/* 3. Jungle Gaming Logo Asset at Bottom Right */}
      <div className="fixed bottom-4 right-4 z-30 pointer-events-auto">
        <img
          src="/assets/logo_jungle_gaming.svg"
          alt="Jungle Gaming Logo"
          className="h-8 sm:h-10 w-auto object-contain"
        />
      </div>

      {/* VIEW 1: MAIN MENU SCREEN (matching sample_menu.png) */}
      {currentView === 'menu' && (
        <div className="relative z-20 flex items-center justify-center p-4">
          <WoodenPanel className="max-h-[92vh]">
            <div className="pb-4 pt-2 px-20 flex flex-col items-center gap-2">
              {/* Pirate Battle Title Logo Asset */}
              <div className="flex flex-col items-center">
                <img
                  src="/assets/png/default/ui/menu/title_pirate_battle.png"
                  alt="Pirate Battle Title"
                  className="w-full h-auto object-contain"
                />
                <span className="text-[10px] font-sans uppercase tracking-widest font-extrabold text-secondary">
                  SET SAIL. TAKE COMMAND.
                </span>
              </div>

              {/* Primary Action Buttons: PLAY & OPTIONS */}
              <div className="w-full flex flex-col items-center">
                <WoodenButton
                  variant="primary"
                  size="lg"
                  onClick={handlePlayClick}
                  className="w-56 py-4"
                >
                  PLAY
                </WoodenButton>

                <WoodenButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    soundManager.playOpen()
                    setCurrentView('options')
                  }}
                  className="w-56 py-4"
                >
                  OPTIONS
                </WoodenButton>
              </div>

              {/* Ship Selector (Interactive Ship between Options and Subtitle) */}
              <div className="flex flex-col items-center justify-center space-y-1 my-1">
                <button
                  type="button"
                  onClick={handleShipClick}
                  title="Click to select ship"
                  className="group relative p-2 rounded-xl transition-opacity hover:opacity-90 active:opacity-75 cursor-pointer focus:outline-none"
                >
                  <img
                    src={`/assets/png/retina/ships/${currentShip}`}
                    alt={`Selected Ship ${currentShipNum}`}
                    className="h-12 w-auto object-contain"
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-sans uppercase font-extrabold text-secondary bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-900/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Ship #{currentShipNum} (Click to Change)
                  </span>
                </button>

                <span className="text-xs font-sans text-secondary font-bold">
                  Navigate the islands. Survive the battle.
                </span>
              </div>

              {/* Secondary Action Buttons: RANKING & MATCH HISTORY */}
              <div className="w-full flex items-center justify-between gap-2">
                <WoodenButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    soundManager.playOpen()
                    setCurrentView('ranking')
                  }}
                  className="flex-1 py-3"
                >
                  RANKING
                </WoodenButton>

                <WoodenButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    soundManager.playOpen()
                    setCurrentView('history')
                  }}
                  className="flex-1 whitespace-nowrap py-3"
                >
                  MATCH HISTORY
                </WoodenButton>
              </div>
            </div>
          </WoodenPanel>
        </div>
      )}

      {/* VIEW 2: OPTIONS SCREEN (matching sample_options.png) */}
      {currentView === 'options' && (
        <div className="relative z-20 flex items-center justify-center">
          <OptionsScreen onBackToMenu={() => setCurrentView('menu')} />
        </div>
      )}

      {/* VIEW 3: CAPTAIN'S LOG - RANKING OR HISTORY (matching sample_ranking.png & sample_history.png) */}
      {(currentView === 'ranking' || currentView === 'history') && (
        <div className="relative z-20 flex items-center justify-center">
          <CaptainsLog
            initialTab={currentView as 'ranking' | 'history'}
            onBackToMenu={() => setCurrentView('menu')}
          />
        </div>
      )}
    </div>
  )
}
