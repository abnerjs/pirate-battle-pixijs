import { Home, Navigation, Play, RotateCcw, Target, Volume2, VolumeX } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useSaveMatchMutation } from '@/api/queries'
import { ResultModal } from '@/components/menu/result-modal'
import { Button } from '@/components/ui/button'
import type { GameOptions, MatchHistoryEntry } from '@/types/game'

interface GameViewProps {
  config: GameOptions
  onExitToMenu: () => void
  isMuted: boolean
  toggleMute: () => void
}

export const GameView: React.FC<GameViewProps> = ({
  config,
  onExitToMenu,
  isMuted,
  toggleMute,
}) => {
  // Game state
  const [playerHp, setPlayerHp] = useState(100)
  const [maxHp] = useState(100)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.gameSessionTime)
  const [isPaused, setIsPaused] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [matchResult, setMatchResult] = useState<MatchHistoryEntry | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'failed'>(
    'idle',
  )

  // Cooldown states
  const [frontCooldown, setFrontCooldown] = useState(0)
  const [sideCooldown, setSideCooldown] = useState(0)

  const saveMutation = useSaveMatchMutation()

  // Match timer loop
  useEffect(() => {
    if (isPaused || isGameOver) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleEndMatch('time_up')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused, isGameOver])

  // Cooldown timer loop
  useEffect(() => {
    if (isPaused || isGameOver) return

    const cdTimer = setInterval(() => {
      setFrontCooldown((prev) => Math.max(0, prev - 100))
      setSideCooldown((prev) => Math.max(0, prev - 100))
    }, 100)

    return () => clearInterval(cdTimer)
  }, [isPaused, isGameOver])

  // Keybindings for Pause & Weapons simulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused((prev) => !prev)
      }

      if (!isPaused) {
        if (e.code === 'Space' || e.key === 'j' || e.key === 'J') {
          if (frontCooldown === 0) {
            setFrontCooldown(600) // 0.6s cooldown
            if (Math.random() > 0.4) {
              setScore((s) => s + 1)
            }
          }
        }

        if (
          e.key === 'q' ||
          e.key === 'Q' ||
          e.key === 'e' ||
          e.key === 'E' ||
          e.key === 'u' ||
          e.key === 'U' ||
          e.key === 'i' ||
          e.key === 'I'
        ) {
          if (sideCooldown === 0) {
            setSideCooldown(1500) // 1.5s cooldown
            const hits = Math.floor(Math.random() * 3)
            setScore((s) => s + hits)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, isGameOver, frontCooldown, sideCooldown])

  // End match handler
  const handleEndMatch = async (reason: 'victory' | 'destroyed' | 'time_up') => {
    setIsGameOver(true)
    const timePlayed = config.gameSessionTime - timeLeft

    const newMatch: MatchHistoryEntry = {
      id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      playerName: 'Captain Player',
      score: score,
      duration: Math.max(1, timePlayed),
      date: new Date().toISOString(),
      endReason: reason,
      config: { ...config },
      status: 'pending',
    }

    setMatchResult(newMatch)
    setUploadStatus('uploading')

    try {
      await saveMutation.mutateAsync(newMatch)
      setUploadStatus('success')
    } catch (e) {
      console.error('Failed to submit match', e)
      setUploadStatus('failed')
    }
  }

  const handleRestart = () => {
    setPlayerHp(100)
    setScore(0)
    setTimeLeft(config.gameSessionTime)
    setIsPaused(false)
    setIsGameOver(false)
    setMatchResult(null)
    setUploadStatus('idle')
    setFrontCooldown(0)
    setSideCooldown(0)
  }

  const handleSimulateDamage = () => {
    setPlayerHp((hp) => {
      const nextHp = Math.max(0, hp - 25)
      if (nextHp === 0) {
        handleEndMatch('destroyed')
      }
      return nextHp
    })
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex flex-col justify-between select-none">
      {/* HUD Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent backdrop-blur-sm pointer-events-auto">
        {/* Left: Player Health Bar Asset */}
        {/* Left: Player Health Bar Asset */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-amber-900/40">
          <img
            src="/assets/png/default/ui/hud/icon_heart.png"
            alt="Heart"
            className="h-5 w-5 object-contain"
          />
          <div className="flex flex-col space-y-1 w-32 sm:w-44">
            <div className="flex justify-between text-[11px] font-bold font-mono">
              <span className="text-secondary">HULL HEALTH</span>
              <span className={playerHp < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}>
                {playerHp}/{maxHp}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  playerHp > 50
                    ? 'bg-emerald-500'
                    : playerHp > 25
                      ? 'bg-amber-500'
                      : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${(playerHp / maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Score & Time Counter Assets */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-1.5 rounded-xl border border-amber-900/60">
          <div className="flex items-center gap-1.5 px-2 border-r border-amber-950/40">
            <img
              src="/assets/png/default/ui/hud/icon_score.png"
              alt="Score"
              className="h-4 w-4 object-contain"
            />
            <div className="text-xl font-black font-mono text-secondary">{score}</div>
          </div>

          <div className="flex items-center gap-1.5 px-2">
            <img
              src="/assets/png/default/ui/hud/icon_time.png"
              alt="Time"
              className="h-4 w-4 object-contain"
            />
            <div className="text-xl font-black font-mono text-secondary">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Right: Mute & Pause Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 border-amber-900/60 text-secondary"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-secondary" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(true)}
            className="h-8 text-xs border-amber-900/60 text-secondary hover:bg-amber-950/40"
          >
            <img
              src="/assets/png/default/ui/controls/icon_pause.png"
              alt="Pause"
              className="h-3.5 w-3.5 mr-1 object-contain"
            />{' '}
            Pause
          </Button>
        </div>
      </div>

      {/* Main Canvas Arena Container */}
      <div className="relative flex-1 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-95" />

        <div className="relative z-10 text-center space-y-3 max-w-md p-5 bg-slate-950/80 rounded-2xl border border-amber-900/60 backdrop-blur-md">
          <div className="text-secondary font-sans text-xl font-black flex items-center justify-center gap-2">
            <Navigation className="h-5 w-5 text-secondary animate-spin" /> PixiJS Arena Canvas
          </div>
          <p className="text-xs text-secondary/80">
            Navigation active. Space/J for Front Attack. Q/E for Broadside Fire.
          </p>

          <div className="flex justify-center items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScore((s) => s + 1)}
              className="text-xs border-amber-600/50 text-secondary hover:bg-amber-900/40 h-8"
            >
              <Target className="h-3.5 w-3.5 mr-1" /> Destroy Enemy (+1)
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleSimulateDamage}
              className="text-xs h-8"
            >
              Take Damage (-25 HP)
            </Button>
          </div>
        </div>
      </div>

      {/* Weapons Cooldown HUD Bar */}
      <div className="absolute bottom-3 left-0 right-0 z-30 px-4 flex justify-center pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-amber-900/60 backdrop-blur-md text-xs text-secondary">
          {/* Front Cannon Cooldown */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded border border-slate-800">
            <img
              src="/assets/png/default/ui/controls/icon_fire_front.png"
              alt="Front Cannon"
              className="h-4 w-4 object-contain"
            />
            <div className="font-mono text-[11px]">
              <span className="text-secondary/70">Front: </span>
              {frontCooldown > 0 ? (
                <span className="text-secondary font-bold">
                  {(frontCooldown / 1000).toFixed(1)}s
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">READY</span>
              )}
            </div>
          </div>

          {/* Side Broadside Cooldown */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded border border-slate-800">
            <img
              src="/assets/png/default/ui/controls/icon_fire_left.png"
              alt="Side Cannons"
              className="h-4 w-4 object-contain"
            />
            <div className="font-mono text-[11px]">
              <span className="text-secondary/70">Broadside: </span>
              {sideCooldown > 0 ? (
                <span className="text-secondary font-bold">
                  {(sideCooldown / 1000).toFixed(1)}s
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">READY</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pause Menu Modal */}
      {isPaused && !isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-amber-900/80 rounded-xl p-5 w-full max-w-sm text-center space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black font-sans text-secondary">GAME PAUSED</h2>
              <p className="text-xs text-secondary/70">Simulation suspended</p>
            </div>

            <div className="space-y-2">
              <Button
                variant="pirate"
                onClick={() => setIsPaused(false)}
                className="w-full h-10 text-sm text-primary"
              >
                <Play className="h-4 w-4 mr-2 fill-primary" /> Resume Game
              </Button>

              <Button
                variant="outline"
                onClick={handleRestart}
                className="w-full border-amber-900/60 text-secondary hover:text-white h-9 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-secondary" /> Restart Match
              </Button>

              <Button variant="destructive" onClick={onExitToMenu} className="w-full h-9 text-xs">
                <Home className="h-3.5 w-3.5 mr-1.5" /> Exit to Main Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      <ResultModal
        open={isGameOver}
        matchResult={matchResult}
        uploadStatus={uploadStatus}
        onPlayAgain={handleRestart}
        onMainMenu={onExitToMenu}
        onRetryUpload={async () => {
          if (matchResult) {
            setUploadStatus('uploading')
            try {
              await saveMutation.mutateAsync(matchResult)
              setUploadStatus('success')
            } catch (_e) {
              setUploadStatus('failed')
            }
          }
        }}
      />
    </div>
  )
}
