import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HISTORY_QUERY_KEY, RANKING_QUERY_KEY } from '@/api/queries'
import { GameView } from '@/components/game/game-view'
import { MainMenu } from '@/components/menu/main-menu'
import { Toaster } from '@/components/ui/sonner'
import { preloadGameAssets } from '@/game/asset-loader'
import { useNetworkStore } from '@/lib/network-store'
import type { GameOptions, NetworkScenario } from '@/types/game'

const SCENARIOS: NetworkScenario[] = [
  'success',
  'empty',
  'slow',
  'delayed_post',
  'error_500',
  'timeout',
]

const SCENARIO_DETAILS: Record<NetworkScenario, { label: string; desc: string }> = {
  success: { label: 'ONLINE (200 OK)', desc: 'Normal successful responses' },
  empty: { label: 'EMPTY DATA', desc: 'Returns empty datasets' },
  slow: { label: 'LATENCY (+2s)', desc: 'Introduces 2-second delay' },
  delayed_post: { label: 'DELAYED POST (+3s)', desc: 'Delays match submission by 3s' },
  error_500: {
    label: 'SERVER ERROR (500)',
    desc: 'Simulates 500 Internal Server Error',
  },
  timeout: { label: 'NETWORK TIMEOUT', desc: 'Simulates network connection timeout' },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  const [inGame, setInGame] = useState(false)
  const [activeConfigSnapshot, setActiveConfigSnapshot] = useState<GameOptions | null>(null)

  const handleStartGame = (snapshot: GameOptions) => {
    setActiveConfigSnapshot(snapshot)
    setInGame(true)
  }

  const handleExitToMenu = () => {
    setInGame(false)
    setActiveConfigSnapshot(null)
  }

  // Global keybinding & background asset preloading
  useEffect(() => {
    preloadGameAssets().catch(() => {})

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        const currentScenario = useNetworkStore.getState().scenario
        const currentIndex = SCENARIOS.indexOf(currentScenario)
        const nextScenario = SCENARIOS[(currentIndex + 1) % SCENARIOS.length]
        useNetworkStore.getState().setScenario(nextScenario)
        queryClient.invalidateQueries({ queryKey: RANKING_QUERY_KEY })
        queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })

        const details = SCENARIO_DETAILS[nextScenario]
        toast.custom(
          (_t) => (
            <div className="relative font-sans py-3 px-6 text-secondary min-w-[260px] select-none text-center flex flex-col items-center justify-center shadow-none">
              {/* 9-Slice Background using Secondary Button Hover/Pressed Asset */}
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  borderStyle: 'solid',
                  borderWidth: '12px 18px',
                  borderImageSource:
                    "url('/assets/png/default/ui/menu/button_secondary_pressed.png')",
                  borderImageSlice: '32 36 32 36 fill',
                  borderImageRepeat: 'stretch',
                }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center text-center gap-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-secondary">
                  MSW: {details.label}
                </span>
                <span className="text-[11px] font-bold text-secondary/80">{details.desc}</span>
              </div>
            </div>
          ),
          { duration: 2500 },
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-100 antialiased select-none touch-none">
        {!inGame || !activeConfigSnapshot ? (
          <MainMenu onStartGame={handleStartGame} />
        ) : (
          <GameView config={activeConfigSnapshot} onExitToMenu={handleExitToMenu} />
        )}
      </div>
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
