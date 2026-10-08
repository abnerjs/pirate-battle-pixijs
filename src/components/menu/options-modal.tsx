import { AlertTriangle, CheckCircle2, RotateCcw, Save } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_OPTIONS, useOptionsStore } from '@/lib/options-store'

interface OptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const OptionsModal: React.FC<OptionsModalProps> = ({ open, onOpenChange }) => {
  const { options, updateOptions, resetToDefault } = useOptionsStore()

  // Local state for form inputs
  const [gameSessionTime, setSessionTime] = useState<number>(options.gameSessionTime)
  const [enemySpawnTime, setSpawnTime] = useState<number>(options.enemySpawnTime)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSessionTime(options.gameSessionTime)
      setSpawnTime(options.enemySpawnTime)
      setValidationError(null)
      setSuccessMessage(null)
    }
  }, [open, options])

  const validate = (sessionT: number, spawnT: number): boolean => {
    if (Number.isNaN(sessionT) || sessionT < 60 || sessionT > 180) {
      setValidationError('Game session time must be between 60 and 180 seconds.')
      return false
    }
    if (Number.isNaN(spawnT) || spawnT <= 0 || spawnT > 15) {
      setValidationError('Enemy spawn time must be a positive number up to 15 seconds.')
      return false
    }
    setValidationError(null)
    return true
  }

  const handleSave = () => {
    if (!validate(gameSessionTime, enemySpawnTime)) return

    updateOptions({
      gameSessionTime: Number(gameSessionTime),
      enemySpawnTime: Number(enemySpawnTime),
    })

    setSuccessMessage('Options saved successfully! Future matches will use this snapshot.')
    setTimeout(() => {
      onOpenChange(false)
    }, 1000)
  }

  const handleReset = () => {
    resetToDefault()
    setSessionTime(DEFAULT_OPTIONS.gameSessionTime)
    setSpawnTime(DEFAULT_OPTIONS.enemySpawnTime)
    setValidationError(null)
    setSuccessMessage('Reset to defaults.')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 border-amber-900/80 shadow-2xl text-slate-100">
        <DialogHeader className="border-b border-amber-950/40 pb-3">
          <DialogTitle className="text-xl flex items-center gap-2 text-amber-400 font-serif">
            <img
              src="/assets/png/default/ui/controls/icon_settings.png"
              alt="Settings"
              className="h-5 w-5 object-contain"
            />
            Game Options
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Configure match duration and enemy spawn interval. Saved options are snapshotted on
            match start.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {validationError && (
            <Alert variant="destructive" className="py-2 px-3 text-xs">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-xs font-bold">Invalid Settings</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="py-2 px-3 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertTitle className="text-xs font-bold">Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Option 1: Game Session Time */}
          <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-lg border border-amber-950/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="session-time" className="text-amber-300 font-bold text-xs">
                Game Session Time
              </Label>
              <Badge variant="gold" className="font-mono text-xs">
                {gameSessionTime}s ({Math.floor(gameSessionTime / 60)}m {gameSessionTime % 60}s)
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Active combat session duration (Limits: 60s - 180s).
            </p>
            <div className="flex items-center gap-3">
              <Slider
                value={[gameSessionTime]}
                min={60}
                max={180}
                step={5}
                onValueChange={(vals) => {
                  setSessionTime(vals[0])
                  validate(vals[0], enemySpawnTime)
                }}
                className="flex-1"
              />
              <Input
                id="session-time"
                type="number"
                min={60}
                max={180}
                value={gameSessionTime}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setSessionTime(val)
                  validate(val, enemySpawnTime)
                }}
                className="w-20 font-mono text-center border-amber-900/60 bg-slate-950 text-amber-300 font-bold h-8 text-xs"
              />
            </div>
          </div>

          {/* Option 2: Enemy Spawn Time */}
          <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-lg border border-amber-950/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="spawn-time" className="text-amber-300 font-bold text-xs">
                Enemy Spawn Time
              </Label>
              <Badge variant="gold" className="font-mono text-xs">
                Every {enemySpawnTime.toFixed(1)}s
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Interval between enemy spawns (Limit: positive number &gt; 0s, max 15s).
            </p>
            <div className="flex items-center gap-3">
              <Slider
                value={[enemySpawnTime]}
                min={0.5}
                max={10.0}
                step={0.5}
                onValueChange={(vals) => {
                  setSpawnTime(vals[0])
                  validate(gameSessionTime, vals[0])
                }}
                className="flex-1"
              />
              <Input
                id="spawn-time"
                type="number"
                min={0.5}
                max={15}
                step={0.5}
                value={enemySpawnTime}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setSpawnTime(val)
                  validate(gameSessionTime, val)
                }}
                className="w-20 font-mono text-center border-amber-900/60 bg-slate-950 text-amber-300 font-bold h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between border-t border-amber-950/40 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-amber-900/60 text-slate-400 hover:text-white h-9 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Defaults
          </Button>

          <Button
            type="button"
            variant="pirate"
            onClick={handleSave}
            disabled={!!validationError}
            className="px-5 h-9 text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" /> Save Options
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
