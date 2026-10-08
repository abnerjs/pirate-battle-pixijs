import type React from 'react'
import { useState } from 'react'
import { useMatchHistoryQuery, useRankingQuery } from '@/api/queries'
import { WoodenButton } from '@/components/ui/wooden-button'
import { WoodenPanel } from '@/components/ui/wooden-panel'
import { useOptionsStore } from '@/lib/options-store'

interface CaptainsLogProps {
  initialTab?: 'ranking' | 'history'
  onBackToMenu: () => void
}

export const CaptainsLog: React.FC<CaptainsLogProps> = ({
  initialTab = 'ranking',
  onBackToMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'history'>(initialTab)
  const [rankPage, setRankPage] = useState(1)
  const [histPage, setHistPage] = useState(1)

  const limit = 5

  const { options } = useOptionsStore()

  const rankingQuery = useRankingQuery(rankPage, limit)
  const historyQuery = useMatchHistoryQuery(histPage, limit)

  return (
    <div className="flex items-center justify-center w-full h-full p-2 sm:p-4">
      <WoodenPanel maxWidth="max-w-4xl" className="max-h-[92vh]">
        {/* Title */}
        <div className="pt-2">
          <h2 className="text-2xl sm:text-3xl font-black font-sans text-secondary tracking-wider uppercase">
            CAPTAIN'S LOG
          </h2>
        </div>

        {/* Tab Buttons Row */}
        <div className="flex items-center gap-3 my-2">
          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`relative px-5 py-2 rounded font-sans text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'ranking' ? 'text-primary' : 'text-secondary hover:opacity-80'
            }`}
          >
            <img
              src={
                activeTab === 'ranking'
                  ? '/assets/png/default/ui/menu/button_primary_normal.png'
                  : '/assets/png/default/ui/menu/button_secondary_normal.png'
              }
              alt="tab"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            <span className="relative z-10">RANKING</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`relative px-5 py-2 rounded font-sans text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'history' ? 'text-primary' : 'text-secondary hover:opacity-80'
            }`}
          >
            <img
              src={
                activeTab === 'history'
                  ? '/assets/png/default/ui/menu/button_primary_normal.png'
                  : '/assets/png/default/ui/menu/button_secondary_normal.png'
              }
              alt="tab"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            <span className="relative z-10">MATCH HISTORY</span>
          </button>
        </div>

        {/* Subtitle Info */}
        <div className="text-[11px] font-bold font-sans tracking-widest text-secondary uppercase">
          {activeTab === 'ranking'
            ? `${options.gameSessionTime} SECOND BATTLES · ${options.enemySpawnTime} SECOND SPAWN INTERVAL`
            : 'CAPTAIN JACK · YOUR RECENT BATTLES'}
        </div>

        {/* Tab Content */}
        <div className="w-full flex-1 my-2 flex flex-col justify-between overflow-hidden">
          {activeTab === 'ranking' ? (
            /* RANKING TAB */
            <div className="w-full h-full flex flex-col justify-between">
              <div className="w-full overflow-hidden rounded bg-slate-950/70 border border-amber-950/60 p-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-[10px] font-sans uppercase tracking-widest text-secondary font-bold border-b border-amber-950/40 pb-1.5 px-2">
                  <div className="col-span-2 text-left">RANK</div>
                  <div className="col-span-5 text-left">CAPTAIN</div>
                  <div className="col-span-2 text-right">POINTS</div>
                  <div className="col-span-3 text-right">PLAYED</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-1 mt-1.5">
                  {rankingQuery.isLoading && (
                    <div className="py-6 text-center text-xs text-secondary animate-pulse font-sans">
                      Loading Ranking Data...
                    </div>
                  )}

                  {rankingQuery.isError && (
                    <div className="py-4 text-center text-xs text-red-400 font-sans">
                      Failed to load ranking. Click refresh or check network scenario.
                    </div>
                  )}

                  {!rankingQuery.isLoading &&
                    !rankingQuery.isError &&
                    rankingQuery.data?.data.map((entry, idx) => {
                      const globalRank = (rankingQuery.data.page - 1) * limit + idx + 1
                      const isYou =
                        entry.playerName.toLowerCase().includes('jack') ||
                        entry.playerName.toLowerCase().includes('player')

                      return (
                        <div
                          key={entry.id}
                          className={`grid grid-cols-12 items-center px-2 py-1.5 rounded text-xs transition-colors ${
                            isYou
                              ? 'bg-amber-950/60 border border-amber-500/50'
                              : 'bg-slate-900/50 hover:bg-amber-950/30 border border-slate-800/60'
                          }`}
                        >
                          <div className="col-span-2 text-left font-mono font-bold text-secondary">
                            {globalRank.toString().padStart(2, '0')}
                          </div>
                          <div className="col-span-5 text-left font-bold text-secondary flex items-center gap-1.5">
                            {globalRank === 1 && <span className="text-amber-400">⭐</span>}
                            <span>{entry.playerName}</span>
                            {isYou && (
                              <span className="bg-amber-900/80 text-secondary text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-right font-mono font-extrabold text-secondary">
                            {entry.score}
                          </div>
                          <div className="col-span-3 text-right font-mono text-[11px] text-secondary">
                            {new Date(entry.date)
                              .toLocaleDateString([], { month: 'short', day: '2-digit' })
                              .toUpperCase()}{' '}
                            ·{' '}
                            {new Date(entry.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Ranking Pagination Row */}
              <div className="flex items-center justify-center gap-3 my-1">
                <button
                  type="button"
                  onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                  disabled={rankPage <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-amber-950 border border-amber-900/60 text-secondary disabled:opacity-40"
                >
                  ◄
                </button>
                <span className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-secondary">
                  PAGE {rankingQuery.data?.page || 1} OF {rankingQuery.data?.totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRankPage((p) => Math.min(rankingQuery.data?.totalPages || 1, p + 1))
                  }
                  disabled={rankPage >= (rankingQuery.data?.totalPages || 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-amber-950 border border-amber-900/60 text-secondary disabled:opacity-40"
                >
                  ►
                </button>
              </div>
            </div>
          ) : (
            /* MATCH HISTORY TAB */
            <div className="w-full h-full flex flex-col justify-between">
              <div className="w-full overflow-hidden rounded bg-slate-950/70 border border-amber-950/60 p-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-[10px] font-sans uppercase tracking-widest text-secondary font-bold border-b border-amber-950/40 pb-1.5 px-2">
                  <div className="col-span-4 text-left">DATE</div>
                  <div className="col-span-3 text-right">POINTS</div>
                  <div className="col-span-3 text-right">DURATION</div>
                  <div className="col-span-2 text-right">RESULT</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-1 mt-1.5">
                  {historyQuery.isLoading && (
                    <div className="py-6 text-center text-xs text-secondary animate-pulse font-sans">
                      Loading Match History...
                    </div>
                  )}

                  {historyQuery.isError && (
                    <div className="py-4 text-center text-xs text-red-400 font-sans">
                      Failed to load match history.
                    </div>
                  )}

                  {!historyQuery.isLoading &&
                    !historyQuery.isError &&
                    historyQuery.data?.data.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-12 items-center px-2 py-1.5 rounded text-xs bg-slate-900/50 hover:bg-amber-950/30 border border-slate-800/60"
                      >
                        <div className="col-span-4 text-left font-mono text-secondary text-[11px]">
                          {new Date(entry.date)
                            .toLocaleDateString([], { month: 'short', day: '2-digit' })
                            .toUpperCase()}{' '}
                          ·{' '}
                          {new Date(entry.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="col-span-3 text-right font-mono font-extrabold text-secondary">
                          {entry.score}
                        </div>
                        <div className="col-span-3 text-right font-mono text-secondary text-[11px]">
                          {Math.floor(entry.duration / 60)
                            .toString()
                            .padStart(2, '0')}
                          :{(entry.duration % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="col-span-2 text-right font-sans font-extrabold text-[10px] uppercase">
                          {entry.endReason === 'time_up' ? (
                            <span className="text-secondary">TIME UP</span>
                          ) : entry.endReason === 'victory' ? (
                            <span className="text-emerald-400">VICTORY</span>
                          ) : (
                            <span className="text-rose-400">DEFEATED</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* History Pagination Row */}
              <div className="flex items-center justify-center gap-3 my-1">
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                  disabled={histPage <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-amber-950 border border-amber-900/60 text-secondary disabled:opacity-40"
                >
                  ◄
                </button>
                <span className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-secondary">
                  PAGE {historyQuery.data?.page || 1} OF {historyQuery.data?.totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setHistPage((p) => Math.min(historyQuery.data?.totalPages || 1, p + 1))
                  }
                  disabled={histPage >= (historyQuery.data?.totalPages || 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-amber-950 border border-amber-900/60 text-secondary disabled:opacity-40"
                >
                  ►
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="pb-1">
          <WoodenButton variant="primary" size="lg" onClick={onBackToMenu} className="w-56">
            MAIN MENU
          </WoodenButton>
        </div>
      </WoodenPanel>
    </div>
  )
}
