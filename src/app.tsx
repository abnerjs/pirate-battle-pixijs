import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { GameView } from '@/components/game/game-view'
import { MainMenu } from '@/components/menu/main-menu'
import type { GameOptions } from '@/types/game'

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
  const [isMuted, setIsMuted] = useState(false)

  const handleStartGame = (snapshot: GameOptions) => {
    setActiveConfigSnapshot(snapshot)
    setInGame(true)
  }

  const handleExitToMenu = () => {
    setInGame(false)
    setActiveConfigSnapshot(null)
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased select-none">
        {!inGame || !activeConfigSnapshot ? (
          <MainMenu onStartGame={handleStartGame} isMuted={isMuted} toggleMute={toggleMute} />
        ) : (
          <GameView
            config={activeConfigSnapshot}
            onExitToMenu={handleExitToMenu}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />
        )}
      </div>
    </QueryClientProvider>
  )
}
