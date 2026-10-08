import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameOptions } from '@/types/game'

export const AVAILABLE_SHIPS = [
  'ship_1.png',
  'ship_2.png',
  'ship_3.png',
  'ship_4.png',
  'ship_5.png',
  'ship_6.png',
]

export const DEFAULT_OPTIONS: GameOptions = {
  gameSessionTime: 120, // 2 minutes default (between 60 and 180)
  enemySpawnTime: 3.0, // 3 seconds default
  selectedShip: 'ship_1.png',
}

interface OptionsState {
  options: GameOptions
  setGameSessionTime: (time: number) => void
  setEnemySpawnTime: (time: number) => void
  setSelectedShip: (ship: string) => void
  cycleSelectedShip: () => void
  updateOptions: (newOptions: Partial<GameOptions>) => void
  resetToDefault: () => void
  getSnapshot: () => GameOptions
}

export const useOptionsStore = create<OptionsState>()(
  persist(
    (set, get) => ({
      options: { ...DEFAULT_OPTIONS },

      setGameSessionTime: (time: number) => {
        const clamped = Math.max(60, Math.min(180, time))
        set((state) => ({
          options: { ...state.options, gameSessionTime: clamped },
        }))
      },

      setEnemySpawnTime: (time: number) => {
        const clamped = Math.max(0.5, Math.min(15.0, Number(time.toFixed(1))))
        set((state) => ({
          options: { ...state.options, enemySpawnTime: clamped },
        }))
      },

      setSelectedShip: (ship: string) => {
        set((state) => ({
          options: { ...state.options, selectedShip: ship },
        }))
      },

      cycleSelectedShip: () => {
        const current = get().options.selectedShip || 'ship_1.png'
        const index = AVAILABLE_SHIPS.indexOf(current)
        const nextIndex = (index + 1) % AVAILABLE_SHIPS.length
        const nextShip = AVAILABLE_SHIPS[nextIndex]

        set((state) => ({
          options: { ...state.options, selectedShip: nextShip },
        }))
      },

      updateOptions: (newOptions: Partial<GameOptions>) => {
        set((state) => ({
          options: { ...state.options, ...newOptions },
        }))
      },

      resetToDefault: () => {
        set({ options: { ...DEFAULT_OPTIONS } })
      },

      getSnapshot: () => {
        return { ...get().options }
      },
    }),
    {
      name: 'pirate_battle_options_v1',
    },
  ),
)
