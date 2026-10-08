import { create } from 'zustand'
import type { NetworkScenario } from '@/types/game'

interface NetworkState {
  scenario: NetworkScenario
  setScenario: (scenario: NetworkScenario) => void
  resetFixturesSignal: number
  triggerResetFixtures: () => void
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  scenario: 'success',
  setScenario: (scenario) => set({ scenario }),
  resetFixturesSignal: 0,
  triggerResetFixtures: () =>
    set((state) => ({ resetFixturesSignal: state.resetFixturesSignal + 1 })),
}))
