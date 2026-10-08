import type React from 'react'
import { useEffect, useState } from 'react'
import { useMatchHistoryQuery, useRankingQuery } from '@/api/queries'
import { RoundedButton } from '@/components/ui/rounded-button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Reset ranking page when options filter changes
  useEffect(() => {
    setRankPage(1)
  }, [options.gameSessionTime, options.enemySpawnTime])

  const rankingQuery = useRankingQuery(
    rankPage,
    limit,
    options.gameSessionTime,
    options.enemySpawnTime,
  )
  const historyQuery = useMatchHistoryQuery(histPage, limit)

  return (
    <div className="flex items-center justify-center w-full h-full p-2 sm:p-4">
      <WoodenPanel>
        <div className="flex flex-col px-4 py-2">
          {/* Title */}
          <div className="pt-2">
            <h2 className="text-2xl sm:text-3xl font-black font-sans text-secondary uppercase">
              CAPTAIN'S LOG
            </h2>
          </div>

          <Tabs
            defaultValue={initialTab}
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'ranking' | 'history')}
            className="w-full flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* Tab Buttons Row */}
            <div className="flex flex-col items-center my-2">
              <TabsList>
                <TabsTrigger value="ranking" className="w-full">
                  RANKING
                </TabsTrigger>
                <TabsTrigger value="history" className="w-full whitespace-nowrap">
                  MATCH HISTORY
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Subtitle Info */}
            <div className="text-[11px] font-bold font-sans tracking-widest text-secondary uppercase text-center">
              {activeTab === 'ranking'
                ? `${options.gameSessionTime} SECOND BATTLES · ${options.enemySpawnTime} SECOND SPAWN INTERVAL`
                : 'YOUR RECENT BATTLES'}
            </div>

            {/* Tab Content */}
            <div className="w-full flex-1 my-2 flex flex-col justify-between overflow-hidden">
              <TabsContent
                value="ranking"
                className="w-full h-full flex flex-col justify-between m-0"
              >
                <div className="w-full overflow-hidden rounded p-2 min-w-[466px] min-h-[267px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-[10px] font-sans uppercase tracking-widest text-secondary font-bold pb-2 px-2">
                    <div className="col-span-2 text-left">RANK</div>
                    <div className="col-span-5 text-left">CAPTAIN</div>
                    <div className="col-span-2 text-left">POINTS</div>
                    <div className="col-span-3 text-left">PLAYED</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-1">
                    {rankingQuery.isLoading && (
                      <div className="py-6 flex justify-center">
                        <Spinner />
                      </div>
                    )}

                    {rankingQuery.isError && (
                      <button
                        type="button"
                        onClick={() => rankingQuery.refetch()}
                        className="w-full py-6 text-center text-sm text-secondary font-sans"
                      >
                        Failed to load ranking. Click here to refresh.
                      </button>
                    )}

                    {!rankingQuery.isLoading &&
                      !rankingQuery.isError &&
                      rankingQuery.data?.data.map((entry, idx) => {
                        const globalRank = (rankingQuery.data.page - 1) * limit + idx + 1
                        const isYou = entry.playerId === 'player'

                        return (
                          <div
                            key={entry.id}
                            className={`grid grid-cols-12 items-center px-2 py-3 rounded text-xs transition-colors ${
                              isYou
                                ? 'bg-yellow-300/20 border border-yellow-300/20'
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
                                <span className="bg-yellow-300/30 text-secondary text-[8px] font-bold px-1 rounded border border-yellow-300/30">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 text-left font-mono font-extrabold text-secondary">
                              {entry.score}
                            </div>
                            <div className="col-span-3 text-left font-mono text-[10px] text-secondary whitespace-nowrap">
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
                  <RoundedButton
                    size="sm"
                    onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                    disabled={rankPage <= 1}
                    aria-label="Previous Page"
                  >
                    <img
                      src="/assets/png/default/ui/controls/icon_turn_left.png"
                      alt="Previous"
                      className="w-4 h-4 object-contain"
                    />
                  </RoundedButton>
                  <span className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-secondary">
                    PAGE {rankingQuery.data?.page || 1} OF {rankingQuery.data?.totalPages || 1}
                  </span>
                  <RoundedButton
                    size="sm"
                    onClick={() =>
                      setRankPage((p) => Math.min(rankingQuery.data?.totalPages || 1, p + 1))
                    }
                    disabled={rankPage >= (rankingQuery.data?.totalPages || 1)}
                    aria-label="Next Page"
                  >
                    <img
                      src="/assets/png/default/ui/controls/icon_turn_right.png"
                      alt="Next"
                      className="w-4 h-4 object-contain"
                    />
                  </RoundedButton>
                </div>
              </TabsContent>

              <TabsContent
                value="history"
                className="w-full h-full flex flex-col justify-between m-0"
              >
                <div className="w-full overflow-hidden rounded p-2 min-w-[466px] min-h-[267px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-[10px] font-sans uppercase tracking-widest text-secondary font-bold pb-2 px-2">
                    <div className="col-span-4 text-left">DATE</div>
                    <div className="col-span-3 text-left">POINTS</div>
                    <div className="col-span-3 text-left">DURATION</div>
                    <div className="col-span-2 text-left">RESULT</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-1">
                    {historyQuery.isLoading && (
                      <div className="py-6 flex justify-center">
                        <Spinner />
                      </div>
                    )}

                    {historyQuery.isError && (
                      <button
                        type="button"
                        onClick={() => historyQuery.refetch()}
                        className="w-full py-6 text-center text-sm text-secondary font-sans"
                      >
                        Failed to load match history. Click here to refresh.
                      </button>
                    )}

                    {!historyQuery.isLoading &&
                      !historyQuery.isError &&
                      historyQuery.data?.data.map((entry) => (
                        <div
                          key={entry.id}
                          className="grid grid-cols-12 items-center px-2 py-3 rounded text-xs transition-colors bg-slate-900/50 hover:bg-amber-950/30 border border-slate-800/60"
                        >
                          <div className="col-span-4 text-left font-mono text-[10px] text-secondary whitespace-nowrap">
                            {new Date(entry.date)
                              .toLocaleDateString([], { month: 'short', day: '2-digit' })
                              .toUpperCase()}{' '}
                            ·{' '}
                            {new Date(entry.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="col-span-3 text-left font-mono font-extrabold text-secondary">
                            {entry.score}
                          </div>
                          <div className="col-span-3 text-left font-mono text-[10px] text-secondary whitespace-nowrap">
                            {Math.floor(entry.duration / 60)
                              .toString()
                              .padStart(2, '0')}
                            :{(entry.duration % 60).toString().padStart(2, '0')}
                          </div>
                          <div className="col-span-2 text-left font-sans font-extrabold text-[10px] uppercase">
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
                  <RoundedButton
                    size="sm"
                    onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                    disabled={histPage <= 1}
                    aria-label="Previous Page"
                  >
                    <img
                      src="/assets/png/default/ui/controls/icon_turn_left.png"
                      alt="Previous"
                      className="w-4 h-4 object-contain"
                    />
                  </RoundedButton>
                  <span className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-secondary">
                    PAGE {historyQuery.data?.page || 1} OF {historyQuery.data?.totalPages || 1}
                  </span>
                  <RoundedButton
                    size="sm"
                    onClick={() =>
                      setHistPage((p) => Math.min(historyQuery.data?.totalPages || 1, p + 1))
                    }
                    disabled={histPage >= (historyQuery.data?.totalPages || 1)}
                    aria-label="Next Page"
                  >
                    <img
                      src="/assets/png/default/ui/controls/icon_turn_right.png"
                      alt="Next"
                      className="w-4 h-4 object-contain"
                    />
                  </RoundedButton>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom Button */}
          <div className="pb-1">
            <WoodenButton variant="primary" size="lg" onClick={onBackToMenu} className="w-56">
              MAIN MENU
            </WoodenButton>
          </div>
        </div>
      </WoodenPanel>
    </div>
  )
}
