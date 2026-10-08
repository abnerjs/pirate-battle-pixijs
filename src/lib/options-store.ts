import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameOptions } from '@/types/game'

export const SESSION_TIME_OPTIONS = [60, 90, 120, 180] as const
export const SPAWN_TIME_OPTIONS = [1, 3, 5] as const

export const AVAILABLE_SHIPS = [
  'ship_1.png',
  'ship_2.png',
  'ship_3.png',
  'ship_4.png',
  'ship_5.png',
  'ship_6.png',
]

export const DEFAULT_OPTIONS: GameOptions = {
  gameSessionTime: 120, // 120s default (options: 60, 90, 120, 180)
  enemySpawnTime: 3, // 3s default (options: 1, 3, 5)
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
        // Find exact or closest valid session time
        const validTime = SESSION_TIME_OPTIONS.reduce((prev, curr) =>
          Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev,
        )
        set((state) => ({
          options: { ...state.options, gameSessionTime: validTime },
        }))
      },

      setEnemySpawnTime: (time: number) => {
        // Find exact or closest valid spawn time
        const validTime = SPAWN_TIME_OPTIONS.reduce((prev, curr) =>
          Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev,
        )
        set((state) => ({
          options: { ...state.options, enemySpawnTime: validTime },
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
