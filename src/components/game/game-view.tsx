import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSaveMatchMutation } from '@/api/queries'
import { ResultModal } from '@/components/menu/result-modal'
import { CounterPanel } from '@/components/ui/counter-panel'
import { RoundedButton } from '@/components/ui/rounded-button'
import { WoodenButton } from '@/components/ui/wooden-button'
import { WoodenPanel } from '@/components/ui/wooden-panel'
import { DEFAULT_BALANCE_CONFIG } from '@/game/config/game-config'
import { GameEngine } from '@/game/game-engine'
import type { InputState } from '@/game/input/input-controller'
import type { GameOptions, MatchHistoryEntry } from '@/types/game'

interface GameViewProps {
  config: GameOptions
  onExitToMenu: () => void
}

export const GameView: React.FC<GameViewProps> = ({ config, onExitToMenu }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  // HUD & Game state synced from engine
  const [playerHp, setPlayerHp] = useState(100)
  const [maxHp, setMaxHp] = useState(100)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.gameSessionTime)
  const [isPaused, setIsPaused] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  // Cooldown states for HUD
  const [frontCooldown, setFrontCooldown] = useState(0)
  const [leftCooldown, setLeftCooldown] = useState(0)
  const [rightCooldown, setRightCooldown] = useState(0)

  // Active Input state for HUD button highlighting
  const [activeInput, setActiveInput] = useState<InputState>({
    moveForward: false,
    turnLeft: false,
    turnRight: false,
    fireLeft: false,
    fireFront: false,
    fireRight: false,
  })

  // Result & Upload states
  const [matchResult, setMatchResult] = useState<MatchHistoryEntry | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'failed'>(
    'idle',
  )

  // Loading Screen state
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)

  const saveMutation = useSaveMatchMutation()

  // Initialize PixiJS GameEngine
  useEffect(() => {
    if (!canvasContainerRef.current) return

    const container = canvasContainerRef.current
    setIsLoading(true)
    setLoadProgress(0)

    const engine = new GameEngine(config, {
      onStateUpdate: (state) => {
        setPlayerHp(state.playerHp)
        setMaxHp(state.maxHp)
        setScore(state.score)
        setTimeLeft(state.timeLeft)
        setFrontCooldown(state.frontCooldown)
        setLeftCooldown(state.leftCooldown)
        setRightCooldown(state.rightCooldown)
        setIsPaused(state.isPaused)
        setIsGameOver(state.isGameOver)
        if (state.inputState) setActiveInput(state.inputState)
      },
      onEndMatch: (reason) => {
        handleEndMatch(reason)
      },
    })

    engineRef.current = engine
    engine
      .init(container, (progress) => {
        setLoadProgress(Math.min(100, Math.max(0, Math.round(progress * 100))))
      })
      .then(() => {
        setIsLoading(false)
      })
      .catch((err) => {
        console.warn('GameEngine init error:', err)
        setIsLoading(false)
      })

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [config])

  // End match handler
  const handleEndMatch = async (reason: 'victory' | 'destroyed' | 'time_up') => {
    const currentScore = engineRef.current ? engineRef.current.score : score
    const timePlayed =
      config.gameSessionTime - (engineRef.current ? Math.ceil(engineRef.current.timeLeft) : 0)

    const newMatch: MatchHistoryEntry = {
      id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      playerId: 'player',
      playerName: 'Flapjack',
      score: currentScore,
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
    if (!canvasContainerRef.current) return
    if (engineRef.current) {
      engineRef.current.destroy()
      engineRef.current = null
    }

    setPlayerHp(100)
    setScore(0)
    setTimeLeft(config.gameSessionTime)
    setIsPaused(false)
    setIsGameOver(false)
    setMatchResult(null)
    setUploadStatus('idle')
    setIsLoading(true)
    setLoadProgress(0)

    const engine = new GameEngine(config, {
      onStateUpdate: (state) => {
        setPlayerHp(state.playerHp)
        setMaxHp(state.maxHp)
        setScore(state.score)
        setTimeLeft(state.timeLeft)
        setFrontCooldown(state.frontCooldown)
        setLeftCooldown(state.leftCooldown)
        setRightCooldown(state.rightCooldown)
        setIsPaused(state.isPaused)
        setIsGameOver(state.isGameOver)
        if (state.inputState) setActiveInput(state.inputState)
      },
      onEndMatch: (reason) => {
        handleEndMatch(reason)
      },
    })

    engineRef.current = engine
    engine
      .init(canvasContainerRef.current, (progress) => {
        setLoadProgress(Math.min(100, Math.max(0, Math.round(progress * 100))))
      })
      .then(() => {
        setIsLoading(false)
      })
      .catch((err) => {
        console.warn('GameEngine restart init error:', err)
        setIsLoading(false)
      })
  }

  const handlePauseToggle = () => {
    if (engineRef.current) {
      engineRef.current.togglePause()
    }
  }

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.setPaused(false)
    }
  }

  return (
    <div className="relative w-full h-full h-[100dvh] overflow-hidden bg-slate-950 flex flex-col justify-between select-none touch-none">
      {/* 0. Pirate Loading Screen Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 select-none touch-none">
          {/* Blurred Background Scene Asset */}
          <img
            src="/assets/ui_scene_background.png"
            alt="Loading Scene"
            className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0 filter blur-sm opacity-50"
          />
          <div className="fixed inset-0 bg-black/60 z-10 pointer-events-none" />

          {/* Central Wooden Panel Box */}
          <WoodenPanel className="max-w-md relative z-20">
            <div className="py-6 px-4 sm:px-8 flex flex-col items-center gap-4 w-full">
              {/* Pirate Animated Icon */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <img
                  src="/assets/png/default/ui/hud/icon_score.png"
                  alt="Loading Icon"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain animate-pulse"
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <h2 className="text-xl sm:text-2xl font-black font-sans text-secondary tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  CARREGANDO OS MARES
                </h2>
                <span className="text-xs font-sans text-amber-300/90 font-bold uppercase tracking-wider">
                  PREPARANDO O OCEANO E OS NAVIOS
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-slate-950/90 border-2 border-amber-800/80 rounded-full h-6 p-0.5 relative overflow-hidden shadow-inner my-1">
                <div
                  className="bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-200 flex items-center justify-end pr-2 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  style={{ width: `${Math.max(6, loadProgress)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black font-mono text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {loadProgress}%
                </span>
              </div>

              {/* Pirate Game Tip */}
              <div className="bg-black/50 border border-amber-900/50 rounded-lg p-3 text-center max-w-xs">
                <p className="text-[11px] font-medium text-secondary/90 italic leading-snug">
                  "Dica: Use as teclas W, A, D para navegar e Q / E para disparar as bordadas
                  laterais!"
                </p>
              </div>
            </div>
          </WoodenPanel>
        </div>
      )}

      {/* Top HUD Header: Mobile flex-col-reverse (time & pause above health), SM+: flex-row justify-between */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-[calc(0.75rem+env(safe-area-inset-left,0px))] right-[calc(0.75rem+env(safe-area-inset-right,0px))] z-30 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pointer-events-none">
        {/* Left / Bottom on Mobile: Player Hull Health */}
        <div className="flex items-center gap-2 pointer-events-auto self-start">
          <img
            src="/assets/png/default/ui/hud/icon_heart.png"
            alt="Heart"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 pointer-events-none"
          />
          <div className="relative w-44 sm:w-54 h-9 sm:h-10 flex items-center justify-center">
            {/* Health Frame Asset */}
            <img
              src="/assets/png/default/ui/hud/health_frame.png"
              alt="Health Frame"
              className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
            />
            {/* Health Fill Layer centered inside frame */}
            <div
              className="absolute inset-0 z-10 flex items-center overflow-hidden transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (playerHp / maxHp) * 100))}%` }}
            >
              <img
                src="/assets/png/default/ui/hud/health_fill_green.png"
                alt="Health Fill"
                className="h-full w-full object-fill"
              />
              <p className="absolute text-xs shadow-sm font-bold left-1/2 transform -translate-x-1/2">{`${playerHp}/${maxHp}`}</p>
            </div>
          </div>
        </div>

        {/* Right / Top on Mobile: Score, Time & Pause Control */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto self-end sm:self-center flex-wrap sm:flex-nowrap justify-end">
          <CounterPanel
            icon="/assets/png/default/ui/hud/icon_score.png"
            value={score}
            title="Sunk Ships Score"
          />

          <CounterPanel
            icon="/assets/png/default/ui/hud/icon_time.png"
            value={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
            title="Time Remaining"
          />

          <RoundedButton size="lg" onClick={handlePauseToggle} title="Pause Game (P / Esc)">
            <img
              src="/assets/png/default/ui/controls/icon_pause.png"
              alt="Pause"
              className="w-5 h-5 object-contain pointer-events-none"
            />
          </RoundedButton>
        </div>
      </div>

      {/* 3. Weapons & Touch Controls HUD Bar (No wrapper background, middle button 50% higher) */}
      <div className="absolute bottom-3 sm:bottom-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-3 sm:px-6 pb-[env(safe-area-inset-bottom,0px)] flex justify-between items-end pointer-events-auto">
        {/* Steering Controls (Left / Forward / Right) */}
        <div className="flex items-end gap-1.5">
          <RoundedButton
            size="lg"
            isPressed={activeInput.turnLeft}
            onMouseDown={() => {
              if (engineRef.current) engineRef.current.input.touchTurnLeft = true
            }}
            onMouseUp={() => {
              if (engineRef.current) engineRef.current.input.touchTurnLeft = false
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              if (engineRef.current) engineRef.current.input.touchTurnLeft = true
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              if (engineRef.current) engineRef.current.input.touchTurnLeft = false
            }}
            title="Turn Left (A / Left Arrow)"
          >
            <img
              src="/assets/png/default/ui/controls/icon_turn_left.png"
              alt="Left"
              className="w-5 h-5 object-contain pointer-events-none"
            />
          </RoundedButton>

          {/* Middle Button (Forward) shifted 50% (22px) UP */}
          <div className="-translate-y-[22px]">
            <RoundedButton
              size="lg"
              isPressed={activeInput.moveForward}
              onMouseDown={() => {
                if (engineRef.current) engineRef.current.input.touchMoveForward = true
              }}
              onMouseUp={() => {
                if (engineRef.current) engineRef.current.input.touchMoveForward = false
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                if (engineRef.current) engineRef.current.input.touchMoveForward = true
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                if (engineRef.current) engineRef.current.input.touchMoveForward = false
              }}
              title="Move Forward (W / Up Arrow)"
            >
              <img
                src="/assets/png/default/ui/controls/icon_forward.png"
                alt="Forward"
                className="w-5 h-5 object-contain pointer-events-none"
              />
            </RoundedButton>
          </div>

          <RoundedButton
            size="lg"
            isPressed={activeInput.turnRight}
            onMouseDown={() => {
              if (engineRef.current) engineRef.current.input.touchTurnRight = true
            }}
            onMouseUp={() => {
              if (engineRef.current) engineRef.current.input.touchTurnRight = false
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              if (engineRef.current) engineRef.current.input.touchTurnRight = true
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              if (engineRef.current) engineRef.current.input.touchTurnRight = false
            }}
            title="Turn Right (D / Right Arrow)"
          >
            <img
              src="/assets/png/default/ui/controls/icon_turn_right.png"
              alt="Right"
              className="w-5 h-5 object-contain pointer-events-none"
            />
          </RoundedButton>
        </div>

        {/* Weapons Attack Buttons (Left Broadside / Front Cannon / Right Broadside) */}
        <div className="flex items-end gap-1.5">
          {/* Left Broadside */}
          <div className="relative">
            <RoundedButton
              size="lg"
              isPressed={activeInput.fireLeft}
              onClick={() => engineRef.current?.fireLeftBroadside()}
              onTouchStart={(e) => {
                e.preventDefault()
                engineRef.current?.fireLeftBroadside()
              }}
              title="Left Broadside (Q / U)"
            >
              <img
                src="/assets/png/default/ui/controls/icon_fire_left.png"
                alt="Fire Left"
                className="w-5 h-5 object-contain pointer-events-none"
              />
            </RoundedButton>
            {leftCooldown > 0 && (
              <div
                className="absolute inset-0.5 rounded-full pointer-events-none z-20 flex items-center justify-center overflow-hidden"
                style={{
                  background: `conic-gradient(rgba(0, 0, 0, 0.75) ${Math.min(
                    360,
                    (leftCooldown / DEFAULT_BALANCE_CONFIG.sideWeapon.cooldown) * 360,
                  )}deg, transparent 0deg)`,
                }}
              >
                <span className="text-[9px] font-mono font-black text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {leftCooldown.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Front Cannon - shifted 50% (22px) UP */}
          <div className="relative -translate-y-[22px]">
            <RoundedButton
              size="lg"
              isPressed={activeInput.fireFront}
              onClick={() => engineRef.current?.fireFrontWeapon()}
              onTouchStart={(e) => {
                e.preventDefault()
                engineRef.current?.fireFrontWeapon()
              }}
              title="Front Attack (Space / J)"
            >
              <img
                src="/assets/png/default/ui/controls/icon_fire_front.png"
                alt="Front Cannon"
                className="w-5 h-5 object-contain pointer-events-none"
              />
            </RoundedButton>
            {frontCooldown > 0 && (
              <div
                className="absolute inset-0.5 rounded-full pointer-events-none z-20 flex items-center justify-center overflow-hidden"
                style={{
                  background: `conic-gradient(rgba(0, 0, 0, 0.75) ${Math.min(
                    360,
                    (frontCooldown / DEFAULT_BALANCE_CONFIG.frontWeapon.cooldown) * 360,
                  )}deg, transparent 0deg)`,
                }}
              >
                <span className="text-[9px] font-mono font-black text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {frontCooldown.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Right Broadside */}
          <div className="relative">
            <RoundedButton
              size="lg"
              isPressed={activeInput.fireRight}
              onClick={() => engineRef.current?.fireRightBroadside()}
              onTouchStart={(e) => {
                e.preventDefault()
                engineRef.current?.fireRightBroadside()
              }}
              title="Right Broadside (E / I)"
            >
              <img
                src="/assets/png/default/ui/controls/icon_fire_right.png"
                alt="Fire Right"
                className="w-5 h-5 object-contain pointer-events-none"
              />
            </RoundedButton>
            {rightCooldown > 0 && (
              <div
                className="absolute inset-0.5 rounded-full pointer-events-none z-20 flex items-center justify-center overflow-hidden"
                style={{
                  background: `conic-gradient(rgba(0, 0, 0, 0.75) ${Math.min(
                    360,
                    (rightCooldown / DEFAULT_BALANCE_CONFIG.sideWeapon.cooldown) * 360,
                  )}deg, transparent 0deg)`,
                }}
              >
                <span className="text-[9px] font-mono font-black text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {rightCooldown.toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Pause Menu Modal */}
      {isPaused && !isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <WoodenPanel className="w-[calc(100vw-1rem)] max-w-md">
            <div className="py-3 sm:py-4 px-2 sm:px-8 flex flex-col items-center gap-3 sm:gap-4 w-full">
              <h2 className="text-2xl sm:text-3xl font-black font-sans text-secondary tracking-wider uppercase">
                PAUSED
              </h2>
              <span className="text-sm font-sans text-secondary/80 font-bold -mt-2">
                Ready when you are
              </span>

              <div className="w-52 flex flex-col items-center gap-2 mt-2">
                <WoodenButton
                  variant="primary"
                  onClick={handleResume}
                  className="w-full py-4 pb-3.5"
                >
                  RESUME
                </WoodenButton>

                {/* we cant go to options here because the game already started */}
                <WoodenButton
                  variant="primary"
                  onClick={handleRestart}
                  className="w-full py-4 pb-3.5"
                >
                  RESTART
                </WoodenButton>

                <WoodenButton
                  variant="primary"
                  onClick={onExitToMenu}
                  className="w-full py-4 pb-3.5"
                >
                  MAIN MENU
                </WoodenButton>
              </div>
            </div>
          </WoodenPanel>
        </div>
      )}

      {/* 2. Main PixiJS Arena Canvas Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full overflow-hidden" />
      </div>

      {/* 5. Result Modal */}
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
