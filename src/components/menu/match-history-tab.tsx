import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  ShieldAlert,
  Skull,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { getPendingMatches, useMatchHistoryQuery, useSaveMatchMutation } from '@/api/queries'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MatchHistoryEntry } from '@/types/game'

export const MatchHistoryTab: React.FC = () => {
  const [page, setPage] = useState(1)
  const limit = 4

  const { data, isLoading, isError, error, refetch, isFetching } = useMatchHistoryQuery(page, limit)
  const saveMutation = useSaveMatchMutation()

  const pendingMatches = getPendingMatches()

  const renderEndReasonBadge = (reason: string) => {
    switch (reason) {
      case 'victory':
        return (
          <Badge
            variant="success"
            className="gap-1 border-emerald-500/40 text-emerald-300 text-[10px] py-0 px-1.5"
          >
            <CheckCircle2 className="h-3 w-3" /> Victory
          </Badge>
        )
      case 'destroyed':
        return (
          <Badge
            variant="destructive"
            className="gap-1 border-red-500/40 text-red-300 text-[10px] py-0 px-1.5"
          >
            <Skull className="h-3 w-3" /> Ship Sunk
          </Badge>
        )
      case 'time_up':
        return (
          <Badge
            variant="gold"
            className="gap-1 border-amber-500/40 text-secondary text-[10px] py-0 px-1.5"
          >
            <Clock className="h-3 w-3" /> Time Expired
          </Badge>
        )
      case 'abandoned':
      default:
        return (
          <Badge
            variant="secondary"
            className="gap-1 border-slate-700 text-secondary text-[10px] py-0 px-1.5"
          >
            <ShieldAlert className="h-3 w-3" /> Abandoned
          </Badge>
        )
    }
  }

  const handleRetryPending = async (match: MatchHistoryEntry) => {
    try {
      await saveMutation.mutateAsync(match)
      refetch()
    } catch (e) {
      console.error('Retry failed', e)
    }
  }

  return (
    <div className="space-y-3 flex flex-col justify-between h-full text-secondary">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/png/default/ui/hud/icon_time.png"
            alt="Time"
            className="h-4 w-4 object-contain"
          />
          <h2 className="text-sm font-bold text-secondary font-sans">Match History</h2>
          {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-secondary" />}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 text-xs border-amber-900/60 text-secondary hover:text-white"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Pending Upload Alert */}
      {pendingMatches.length > 0 && (
        <Alert variant="warning" className="py-2 px-3 border-amber-600/50 bg-amber-950/40">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertTitle className="text-xs font-bold text-secondary">Pending Uploads</AlertTitle>
          <AlertDescription className="text-[11px] space-y-1 mt-0.5 text-secondary">
            <p>{pendingMatches.length} match(es) pending sync.</p>
            <div className="flex gap-1.5">
              {pendingMatches.map((pm) => (
                <Button
                  key={pm.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetryPending(pm)}
                  disabled={saveMutation.isPending}
                  className="h-6 text-[10px] border-amber-500/50 px-2 text-secondary"
                >
                  <RefreshCw
                    className={`h-2.5 w-2.5 mr-1 ${saveMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  Sync #{pm.id.slice(-4)}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="py-2 px-3 border-red-900/60 bg-red-950/40">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-xs font-bold">Failed to load history</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-[11px] mt-0.5">
            <span>{error instanceof Error ? error.message : 'Network error.'}</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => refetch()}
              className="ml-3 h-6 text-[11px] px-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-1.5 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 bg-slate-900/60 animate-pulse rounded border border-slate-800"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data && data.data.length === 0 && (
        <div className="py-8 text-center border border-dashed border-amber-900/40 rounded bg-slate-950/40">
          <p className="text-secondary font-sans text-xs">No match history yet</p>
          <p className="text-[10px] text-secondary/60">Play a battle to record your history!</p>
        </div>
      )}

      {/* History Table */}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
          <Table>
            <TableHeader>
              <TableRow className="border-amber-950/40 hover:bg-transparent h-8">
                <TableHead className="text-xs py-1 text-secondary">Date</TableHead>
                <TableHead className="text-xs py-1 text-secondary">Outcome</TableHead>
                <TableHead className="text-right text-xs py-1 text-secondary">Points</TableHead>
                <TableHead className="text-right text-xs py-1 text-secondary">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((entry) => (
                <TableRow key={entry.id} className="border-amber-950/30 hover:bg-amber-950/30 h-9">
                  <TableCell className="py-1 font-mono text-secondary text-[11px]">
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-1">{renderEndReasonBadge(entry.endReason)}</TableCell>
                  <TableCell className="py-1 text-right font-mono font-extrabold text-secondary text-xs">
                    {entry.score}
                  </TableCell>
                  <TableCell className="py-1 text-right font-mono text-secondary text-[11px]">
                    {entry.duration}s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-amber-950/40 pt-2 text-[11px] text-secondary">
            <div>
              Page <span className="font-bold text-secondary">{data.page}</span> of{' '}
              <span className="font-bold text-secondary">{data.totalPages || 1}</span> ({data.total}{' '}
              matches)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-7 px-2 text-xs border-amber-900/60 text-secondary"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages || isFetching}
                className="h-7 px-2 text-xs border-amber-900/60 text-secondary"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
