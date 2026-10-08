import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useRankingQuery } from '@/api/queries'
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

export const RankingTab: React.FC = () => {
  const [page, setPage] = useState(1)
  const limit = 4

  const { data, isLoading, isError, error, refetch, isFetching } = useRankingQuery(page, limit)

  const renderRankBadge = (globalIndex: number) => {
    if (globalIndex === 0) {
      return (
        <Badge
          variant="gold"
          className="gap-1 border-yellow-400 text-secondary font-extrabold text-[11px] py-0.5 px-2"
        >
          <Trophy className="h-3 w-3 text-yellow-400 fill-yellow-400" /> #1 Gold
        </Badge>
      )
    }
    if (globalIndex === 1) {
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-slate-800 border-slate-400 text-secondary font-bold text-[11px] py-0.5 px-2"
        >
          <Award className="h-3 w-3 text-slate-300" /> #2 Silver
        </Badge>
      )
    }
    if (globalIndex === 2) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-700/60 text-secondary font-bold text-[11px] py-0.5 px-2"
        >
          <Award className="h-3 w-3 text-amber-600" /> #3 Bronze
        </Badge>
      )
    }
    return (
      <span className="font-mono text-secondary font-semibold px-2 text-xs">
        #{globalIndex + 1}
      </span>
    )
  }

  return (
    <div className="space-y-3 flex flex-col justify-between h-full text-secondary">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/png/default/ui/hud/icon_score.png"
            alt="Score"
            className="h-4 w-4 object-contain"
          />
          <h2 className="text-sm font-bold text-secondary font-sans">Global Leaderboard</h2>
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

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="py-2 px-3 border-red-900/60 bg-red-950/40">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-xs font-bold">Failed to load ranking</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-[11px] mt-0.5">
            <span>
              {error instanceof Error ? error.message : 'Network error or server unavailable.'}
            </span>
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

      {/* Loading state skeleton */}
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

      {/* Empty state */}
      {!isLoading && !isError && data && data.data.length === 0 && (
        <div className="py-8 text-center border border-dashed border-amber-900/40 rounded bg-slate-950/40">
          <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-1" />
          <p className="text-secondary font-sans text-xs">No ranking entries found</p>
          <p className="text-[10px] text-secondary/60">
            Play a match to post the first high score!
          </p>
        </div>
      )}

      {/* Leaderboard Table */}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
          <Table>
            <TableHeader>
              <TableRow className="border-amber-950/40 hover:bg-transparent h-8">
                <TableHead className="w-20 text-xs py-1 text-secondary">Rank</TableHead>
                <TableHead className="text-xs py-1 text-secondary">Captain</TableHead>
                <TableHead className="text-right text-xs py-1 text-secondary">Score</TableHead>
                <TableHead className="text-right text-xs py-1 text-secondary">Duration</TableHead>
                <TableHead className="text-right text-xs py-1 hidden sm:table-cell text-secondary">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((entry, index) => {
                const globalRank = (data.page - 1) * limit + index
                return (
                  <TableRow
                    key={entry.id}
                    className="border-amber-950/30 hover:bg-amber-950/30 h-9"
                  >
                    <TableCell className="py-1">{renderRankBadge(globalRank)}</TableCell>
                    <TableCell className="py-1 font-bold text-secondary text-xs">
                      <span>{entry.playerName}</span>
                    </TableCell>
                    <TableCell className="py-1 text-right font-mono font-extrabold text-secondary text-xs">
                      {entry.score} pts
                    </TableCell>
                    <TableCell className="py-1 text-right font-mono text-secondary text-[11px]">
                      {entry.duration}s
                    </TableCell>
                    <TableCell className="py-1 text-right text-secondary text-[11px] hidden sm:table-cell font-mono">
                      {new Date(entry.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-amber-950/40 pt-2 text-[11px] text-secondary">
            <div>
              Page <span className="font-bold text-secondary">{data.page}</span> of{' '}
              <span className="font-bold text-secondary">{data.totalPages || 1}</span> ({data.total}{' '}
              total)
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
