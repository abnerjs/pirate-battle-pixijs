import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Skull, Trophy } from 'lucide-react'
import type React from 'react'
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
import type { MatchHistoryEntry } from '@/types/game'

interface ResultModalProps {
  open: boolean
  matchResult: MatchHistoryEntry | null
  uploadStatus: 'idle' | 'uploading' | 'success' | 'failed'
  onPlayAgain: () => void
  onMainMenu: () => void
  onRetryUpload: () => void
}

export const ResultModal: React.FC<ResultModalProps> = ({
  open,
  matchResult,
  uploadStatus,
  onPlayAgain,
  onMainMenu,
  onRetryUpload,
}) => {
  if (!matchResult) return null

  const getEndReasonContent = () => {
    switch (matchResult.endReason) {
      case 'victory':
        return {
          title: 'VICTORY AT SEA!',
          badge: <Badge variant="success">Domain Secured</Badge>,
          icon: <Trophy className="h-10 w-10 text-yellow-400 mx-auto" />,
          desc: 'You cleared the high seas of enemy vessels!',
        }
      case 'destroyed':
        return {
          title: 'SHIP DESTROYED!',
          badge: <Badge variant="destructive">Sunk by Enemies</Badge>,
          icon: <Skull className="h-10 w-10 text-red-500 mx-auto" />,
          desc: 'Your hull succumbed to enemy attacks.',
        }
      case 'time_up':
      default:
        return {
          title: 'TIME EXPIRED!',
          badge: <Badge variant="gold">Match Completed</Badge>,
          icon: <Clock className="h-10 w-10 text-secondary mx-auto" />,
          desc: 'The active match duration timer ran out.',
        }
    }
  }

  const content = getEndReasonContent()

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-slate-950 border-amber-900/80 text-secondary">
        <DialogHeader className="text-center border-b border-amber-950/40 pb-3">
          <div className="mb-1">{content.icon}</div>
          <DialogTitle className="text-xl font-black font-sans text-secondary tracking-wider">
            {content.title}
          </DialogTitle>
          <div className="mt-1 flex justify-center">{content.badge}</div>
          <DialogDescription className="text-secondary/80 text-xs mt-1">
            {content.desc}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {/* Stats breakdown */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-xl border border-amber-950/40 text-center">
            <div className="space-y-0.5 border-r border-amber-950/40 pr-2">
              <span className="text-[10px] text-secondary/70 uppercase tracking-wider font-sans">
                Final Score
              </span>
              <div className="text-2xl font-extrabold text-secondary font-mono">
                {matchResult.score} <span className="text-xs text-secondary">pts</span>
              </div>
            </div>
            <div className="space-y-0.5 pl-2">
              <span className="text-[10px] text-secondary/70 uppercase tracking-wider font-sans">
                Time Survived
              </span>
              <div className="text-2xl font-extrabold text-secondary font-mono">
                {matchResult.duration} <span className="text-xs text-secondary">sec</span>
              </div>
            </div>
          </div>

          {/* Upload Status Alert */}
          {uploadStatus === 'uploading' && (
            <Alert variant="warning" className="py-2 px-3">
              <RefreshCw className="h-4 w-4 animate-spin text-secondary" />
              <AlertTitle className="text-xs font-bold text-secondary">
                Syncing Match with Server...
              </AlertTitle>
              <AlertDescription className="text-[11px]">
                Submitting score to ranking and history via MSW.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'success' && (
            <Alert variant="success" className="py-2 px-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertTitle className="text-xs font-bold text-emerald-300">
                Match Saved Successfully!
              </AlertTitle>
              <AlertDescription className="text-[11px]">
                Leaderboard and match history updated.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'failed' && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-xs font-bold text-red-300">
                Network Interrupted
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between text-[11px] mt-1">
                <span>Stored in offline queue. Retry when ready.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetryUpload}
                  className="h-6 text-[10px] border-red-500/50"
                >
                  Retry Upload
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-[10px] text-secondary/60 text-center font-mono">
            Config snapshot: {matchResult.config.gameSessionTime}s duration,{' '}
            {matchResult.config.enemySpawnTime}s spawn
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 border-t border-amber-950/40 pt-3">
          <Button
            variant="outline"
            onClick={onMainMenu}
            className="w-1/2 border-amber-900/60 text-secondary hover:text-white h-9 text-xs"
          >
            <img
              src="/assets/png/default/ui/controls/icon_home.png"
              alt="Home"
              className="h-4 w-4 mr-1.5 object-contain"
            />{' '}
            Main Menu
          </Button>

          <Button variant="pirate" onClick={onPlayAgain} className="w-1/2 h-9 text-xs text-primary">
            <img
              src="/assets/png/default/ui/controls/icon_restart.png"
              alt="Restart"
              className="h-4 w-4 mr-1.5 object-contain"
            />{' '}
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
