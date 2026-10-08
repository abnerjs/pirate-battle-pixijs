import type React from 'react'
import { RoundedButton } from '@/components/ui/rounded-button'
import { WoodenButton } from '@/components/ui/wooden-button'
import { WoodenPanel } from '@/components/ui/wooden-panel'
import { SESSION_TIME_OPTIONS, SPAWN_TIME_OPTIONS, useOptionsStore } from '@/lib/options-store'

interface OptionsScreenProps {
  onBackToMenu: () => void
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onBackToMenu }) => {
  const { options, setGameSessionTime, setEnemySpawnTime } = useOptionsStore()

  const currentSessionIndex = SESSION_TIME_OPTIONS.indexOf(
    options.gameSessionTime as (typeof SESSION_TIME_OPTIONS)[number],
  )
  const sessionIdx = currentSessionIndex >= 0 ? currentSessionIndex : 2 // default to 120 (index 2)

  const currentSpawnIndex = SPAWN_TIME_OPTIONS.indexOf(
    options.enemySpawnTime as (typeof SPAWN_TIME_OPTIONS)[number],
  )
  const spawnIdx = currentSpawnIndex >= 0 ? currentSpawnIndex : 1 // default to 3 (index 1)

  const handleDecreaseTime = () => {
    if (sessionIdx > 0) {
      setGameSessionTime(SESSION_TIME_OPTIONS[sessionIdx - 1])
    }
  }

  const handleIncreaseTime = () => {
    if (sessionIdx < SESSION_TIME_OPTIONS.length - 1) {
      setGameSessionTime(SESSION_TIME_OPTIONS[sessionIdx + 1])
    }
  }

  const handleDecreaseSpawn = () => {
    if (spawnIdx > 0) {
      setEnemySpawnTime(SPAWN_TIME_OPTIONS[spawnIdx - 1])
    }
  }

  const handleIncreaseSpawn = () => {
    if (spawnIdx < SPAWN_TIME_OPTIONS.length - 1) {
      setEnemySpawnTime(SPAWN_TIME_OPTIONS[spawnIdx + 1])
    }
  }

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <WoodenPanel>
        <div className="flex flex-col justify-center items-center h-full px-40 py-12 gap-2">
          {/* Title */}
          <h2 className="text-3xl font-black font-sans text-secondary tracking-wider uppercase">
            OPTIONS
          </h2>

          {/* Options Content */}
          <div className="w-full max-w-md my-auto space-y-6">
            {/* Option 1: Game session time */}
            <div className="space-y-2 text-center">
              <label className="text-sm font-sans text-secondary font-bold block">
                Game session time
              </label>
              <div className="flex items-center justify-center gap-6">
                {/* Minus Button */}
                <RoundedButton
                  size="md"
                  onClick={handleDecreaseTime}
                  disabled={sessionIdx <= 0}
                  aria-label="Decrease session time"
                >
                  <img
                    src="/assets/png/default/ui/controls/icon_minus.png"
                    alt="Minus"
                    className="w-5 h-5 object-contain"
                  />
                </RoundedButton>

                {/* Value Display */}
                <span className="text-2xl font-black font-sans text-secondary min-w-[90px] text-center">
                  {options.gameSessionTime} s
                </span>

                {/* Plus Button */}
                <RoundedButton
                  size="md"
                  onClick={handleIncreaseTime}
                  disabled={sessionIdx >= SESSION_TIME_OPTIONS.length - 1}
                  aria-label="Increase session time"
                >
                  <img
                    src="/assets/png/default/ui/controls/icon_plus.png"
                    alt="Plus"
                    className="w-5 h-5 object-contain"
                  />
                </RoundedButton>
              </div>
            </div>

            {/* Option 2: Enemy spawn time */}
            <div className="space-y-2 text-center">
              <label className="text-sm font-sans text-secondary font-bold block">
                Enemy spawn time
              </label>
              <div className="flex items-center justify-center gap-6">
                {/* Minus Button */}
                <RoundedButton
                  size="md"
                  onClick={handleDecreaseSpawn}
                  disabled={spawnIdx <= 0}
                  aria-label="Decrease spawn time"
                >
                  <img
                    src="/assets/png/default/ui/controls/icon_minus.png"
                    alt="Minus"
                    className="w-5 h-5 object-contain"
                  />
                </RoundedButton>

                {/* Value Display */}
                <span className="text-2xl font-black font-sans text-secondary min-w-[90px] text-center">
                  {options.enemySpawnTime} s
                </span>

                {/* Plus Button */}
                <RoundedButton
                  size="md"
                  onClick={handleIncreaseSpawn}
                  disabled={spawnIdx >= SPAWN_TIME_OPTIONS.length - 1}
                  aria-label="Increase spawn time"
                >
                  <img
                    src="/assets/png/default/ui/controls/icon_plus.png"
                    alt="Plus"
                    className="w-5 h-5 object-contain"
                  />
                </RoundedButton>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <WoodenButton variant="primary" size="lg" onClick={onBackToMenu} className="w-full mt-2">
            MAIN MENU
          </WoodenButton>
        </div>
      </WoodenPanel>
    </div>
  )
}
