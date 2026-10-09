import type React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { WoodenButton } from '@/components/ui/wooden-button'
import { WoodenPanel } from '@/components/ui/wooden-panel'
import type { MatchHistoryEntry } from '@/types/game'

interface ResultModalProps {
  open: boolean
  matchResult: MatchHistoryEntry | null
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'failed'
  onPlayAgain: () => void
  onMainMenu: () => void
  onRetryUpload?: () => void
}

export const ResultModal: React.FC<ResultModalProps> = ({
  open,
  matchResult,
  onPlayAgain,
  onMainMenu,
}) => {
  if (!matchResult) return null

  const reasonText = matchResult.endReason === 'destroyed' ? 'Ship Destroyed' : 'Time Up'

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        className="w-[calc(100vw-1rem)] sm:max-w-md bg-transparent border-none shadow-none p-0 overflow-visible"
      >
        <WoodenPanel maxWidth="max-w-md" className="py-4 sm:py-6 px-1 sm:px-8">
          {/* Main Title and Stats */}
          <div className="space-y-3 w-full pt-2">
            <h2 className="text-xl sm:text-3xl font-black font-sans text-secondary tracking-wider uppercase drop-shadow-md">
              Battle complete
            </h2>

            <div className="text-2xl sm:text-3xl font-black font-sans text-amber-300 tracking-wider drop-shadow-md">
              {matchResult.score}
            </div>

            <p className="text-xs font-bold text-secondary/90 tracking-wide pt-1 uppercase">
              points &bull; Time: {matchResult.duration}s &bull; {reasonText}
            </p>
          </div>

          {/* Primary Action Buttons */}

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-3 w-full justify-center items-center pt-4">
            <WoodenButton variant="primary" size="md" onClick={onPlayAgain} className="w-56">
              PLAY AGAIN
            </WoodenButton>

            <WoodenButton variant="primary" size="md" onClick={onMainMenu} className="w-56">
              MAIN MENU
            </WoodenButton>
          </div>
        </WoodenPanel>
      </DialogContent>
    </Dialog>
  )
}
