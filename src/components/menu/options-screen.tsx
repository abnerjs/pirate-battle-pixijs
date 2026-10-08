import type React from 'react'
import { WoodenButton } from '@/components/ui/wooden-button'
import { WoodenPanel } from '@/components/ui/wooden-panel'
import { useOptionsStore } from '@/lib/options-store'

interface OptionsScreenProps {
  onBackToMenu: () => void
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onBackToMenu }) => {
  const { options, setGameSessionTime, setEnemySpawnTime } = useOptionsStore()

  const handleDecreaseTime = () => {
    setGameSessionTime(Math.max(60, options.gameSessionTime - 10))
  }

  const handleIncreaseTime = () => {
    setGameSessionTime(Math.min(180, options.gameSessionTime + 10))
  }

  const handleDecreaseSpawn = () => {
    setEnemySpawnTime(Math.max(0.5, options.enemySpawnTime - 0.5))
  }

  const handleIncreaseSpawn = () => {
    setEnemySpawnTime(Math.min(15.0, options.enemySpawnTime + 0.5))
  }

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <WoodenPanel maxWidth="max-w-xl" className="max-h-[92vh]">
        {/* Title */}
        <div className="pt-2">
          <h2 className="text-3xl font-black font-sans text-secondary tracking-wider uppercase">
            OPTIONS
          </h2>
        </div>

        {/* Options Content */}
        <div className="w-full max-w-md my-auto space-y-6">
          {/* Option 1: Game session time */}
          <div className="space-y-2 text-center">
            <label className="text-xs font-sans uppercase tracking-widest text-secondary font-bold block">
              Game session time
            </label>
            <div className="flex items-center justify-center gap-6">
              {/* Minus Button */}
              <button
                type="button"
                onClick={handleDecreaseTime}
                disabled={options.gameSessionTime <= 60}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-40"
              >
                <img
                  src="/assets/png/default/ui/controls/icon_minus.png"
                  alt="Minus"
                  className="w-full h-full object-contain"
                />
              </button>

              {/* Value Display */}
              <span className="text-2xl font-black font-sans text-secondary min-w-[90px] text-center">
                {options.gameSessionTime} s
              </span>

              {/* Plus Button */}
              <button
                type="button"
                onClick={handleIncreaseTime}
                disabled={options.gameSessionTime >= 180}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-40"
              >
                <img
                  src="/assets/png/default/ui/controls/icon_plus.png"
                  alt="Plus"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>
          </div>

          {/* Option 2: Enemy spawn time */}
          <div className="space-y-2 text-center">
            <label className="text-xs font-sans uppercase tracking-widest text-secondary font-bold block">
              Enemy spawn time
            </label>
            <div className="flex items-center justify-center gap-6">
              {/* Minus Button */}
              <button
                type="button"
                onClick={handleDecreaseSpawn}
                disabled={options.enemySpawnTime <= 0.5}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-40"
              >
                <img
                  src="/assets/png/default/ui/controls/icon_minus.png"
                  alt="Minus"
                  className="w-full h-full object-contain"
                />
              </button>

              {/* Value Display */}
              <span className="text-2xl font-black font-sans text-secondary min-w-[90px] text-center">
                {options.enemySpawnTime} s
              </span>

              {/* Plus Button */}
              <button
                type="button"
                onClick={handleIncreaseSpawn}
                disabled={options.enemySpawnTime >= 15}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-40"
              >
                <img
                  src="/assets/png/default/ui/controls/icon_plus.png"
                  alt="Plus"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="pb-2 space-y-2">
          <WoodenButton variant="primary" size="lg" onClick={onBackToMenu} className="w-56">
            MAIN MENU
          </WoodenButton>
        </div>
      </WoodenPanel>
    </div>
  )
}
