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

const formatDateMobile = (isoString: string) => {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return isoString
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
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

  const isRankingLoading =
    rankingQuery.isPending || rankingQuery.isFetching || rankingQuery.isLoading
  const isHistoryLoading =
    historyQuery.isPending || historyQuery.isFetching || historyQuery.isLoading

  const rankingList = rankingQuery.data?.data ?? []
  const historyList = historyQuery.data?.data ?? []
  const currentRankPage = rankingQuery.data?.page ?? 1

  return (
    <div className="flex items-center justify-center w-full h-full p-1 sm:p-4">
      <WoodenPanel>
        <div className="flex flex-col px-1 sm:px-4 py-1 sm:py-2 w-full">
          {/* Title */}
          <div className="pt-1 sm:pt-2">
            <h2 className="text-xl sm:text-3xl font-black font-sans text-secondary uppercase">
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
            <div className="flex flex-col items-center my-1 sm:my-2">
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
            <div className="text-[9px] sm:text-[11px] font-bold font-sans tracking-widest text-secondary uppercase text-center px-1">
              {activeTab === 'ranking'
                ? `${options.gameSessionTime}S BATTLES · ${options.enemySpawnTime}S SPAWN`
                : 'YOUR RECENT BATTLES'}
            </div>

            {/* Tab Content */}
            <div className="w-full flex-1 my-1 sm:my-2 flex flex-col justify-between overflow-hidden">
              <TabsContent
                value="ranking"
                className="w-full h-full flex flex-col justify-between m-0"
              >
                <div className="w-full overflow-hidden rounded p-1 sm:p-2 min-w-0 sm:min-w-[466px] min-h-[240px] sm:min-h-[267px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-[9px] sm:text-[10px] font-sans uppercase tracking-wider sm:tracking-widest text-secondary font-bold pb-1.5 sm:pb-2 px-1 sm:px-2">
                    <div className="col-span-2 text-left">RANK</div>
                    <div className="col-span-5 text-left">CAPTAIN</div>
                    <div className="col-span-2 text-left">PTS</div>
                    <div className="col-span-3 text-left">PLAYED</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-1">
                    {isRankingLoading && (
                      <div className="py-8 sm:py-12 flex flex-col items-center justify-center gap-2 text-secondary">
                        <Spinner className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                          Searching the Seas for Captains...
                        </span>
                      </div>
                    )}

                    {!isRankingLoading && rankingQuery.isError && (
                      <button
                        type="button"
                        onClick={() => rankingQuery.refetch()}
                        className="w-full py-8 sm:py-10 flex flex-col items-center justify-center gap-1.5 text-center text-xs sm:text-sm text-secondary font-sans hover:text-amber-300 transition-colors"
                      >
                        <span className="font-extrabold text-rose-400">
                          Failed to load crew ranking.
                        </span>
                        <span className="text-[10px] sm:text-xs underline font-bold">
                          Click here to refresh
                        </span>
                      </button>
                    )}

                    {!isRankingLoading && !rankingQuery.isError && rankingList.length === 0 && (
                      <div className="py-6 sm:py-8 px-2 sm:px-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center text-secondary border border-dashed border-amber-900/50 rounded-lg bg-slate-950/40 my-1 sm:my-2">
                        <span className="text-xl sm:text-2xl">📜</span>
                        <h3 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-300">
                          NO CAPTAINS RANKED YET
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-secondary/80 max-w-xs leading-snug">
                          No captain entries found for these battle settings. Be the first to
                          command these waters!
                        </p>
                      </div>
                    )}

                    {!isRankingLoading &&
                      !rankingQuery.isError &&
                      rankingList.map((entry, idx) => {
                        const globalRank = (currentRankPage - 1) * limit + idx + 1
                        const isYou = entry.playerId === 'player'

                        return (
                          <div
                            key={entry.id}
                            className={`grid grid-cols-12 items-center px-1.5 sm:px-2 py-1.5 sm:py-3 rounded text-[10px] sm:text-xs transition-colors ${
                              isYou
                                ? 'bg-yellow-300/20 border border-yellow-300/20'
                                : 'bg-slate-900/50 hover:bg-amber-950/30 border border-slate-800/60'
                            }`}
                          >
                            <div className="col-span-2 text-left font-mono font-bold text-secondary">
                              {globalRank.toString().padStart(2, '0')}
                            </div>
                            <div className="col-span-5 text-left font-bold text-secondary flex items-center gap-1 truncate pr-1">
                              {globalRank === 1 && (
                                <span className="text-amber-400 text-xs">⭐</span>
                              )}
                              <span className="truncate">{entry.playerName}</span>
                              {isYou && (
                                <span className="bg-yellow-300/30 text-secondary text-[7px] sm:text-[8px] font-bold px-0.5 sm:px-1 rounded border border-yellow-300/30 shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 text-left font-mono font-extrabold text-secondary">
                              {entry.score}
                            </div>
                            <div className="col-span-3 text-left font-mono text-[9px] sm:text-[10px] text-secondary whitespace-nowrap">
                              <span className="sm:hidden">{formatDateMobile(entry.date)}</span>
                              <span className="hidden sm:inline">
                                {new Date(entry.date)
                                  .toLocaleDateString([], { month: 'short', day: '2-digit' })
                                  .toUpperCase()}{' '}
                                ·{' '}
                                {new Date(entry.date).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Ranking Pagination Row */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
                  <RoundedButton
                    size="sm"
                    onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                    disabled={rankPage <= 1}
                    aria-label="Previous Page"
                  >
                    <img
                      src="/assets/png/default/ui/controls/icon_turn_left.png"
                      alt="Previous"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain"
                    />
                  </RoundedButton>
                  <span className="text-[10px] sm:text-[11px] font-sans font-extrabold uppercase tracking-widest text-secondary">
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
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain"
                    />
                  </RoundedButton>
                </div>
              </TabsContent>

              <TabsContent
                value="history"
                className="w-full h-full flex flex-col justify-between m-0"
              >
                <div className="w-full overflow-hidden rounded p-1 sm:p-2 min-w-0 sm:min-w-[466px] min-h-[240px] sm:min-h-[267px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-[9px] sm:text-[10px] font-sans uppercase tracking-wider sm:tracking-widest text-secondary font-bold pb-1.5 sm:pb-2 px-1 sm:px-2">
                    <div className="col-span-4 text-left">DATE</div>
                    <div className="col-span-3 text-left">PTS</div>
                    <div className="col-span-3 text-left">TIME</div>
                    <div className="col-span-2 text-left">RESULT</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-1">
                    {isHistoryLoading && (
                      <div className="py-8 sm:py-12 flex flex-col items-center justify-center gap-2 text-secondary">
                        <Spinner className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                          Reading Captain Logbook...
                        </span>
                      </div>
                    )}

                    {!isHistoryLoading && historyQuery.isError && (
                      <button
                        type="button"
                        onClick={() => historyQuery.refetch()}
                        className="w-full py-8 sm:py-10 flex flex-col items-center justify-center gap-1.5 text-center text-xs sm:text-sm text-secondary font-sans hover:text-amber-300 transition-colors"
                      >
                        <span className="font-extrabold text-rose-400">
                          Failed to load match history.
                        </span>
                        <span className="text-[10px] sm:text-xs underline font-bold">
                          Click here to refresh
                        </span>
                      </button>
                    )}

                    {!isHistoryLoading && !historyQuery.isError && historyList.length === 0 && (
                      <div className="py-6 sm:py-8 px-2 sm:px-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center text-secondary border border-dashed border-amber-900/50 rounded-lg bg-slate-950/40 my-1 sm:my-2">
                        <span className="text-xl sm:text-2xl">⚓</span>
                        <h3 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-300">
                          NO BATTLES RECORDED YET
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-secondary/80 max-w-xs leading-snug">
                          No battle entries saved in your logbook yet. Set sail and conquer the sea!
                        </p>
                      </div>
                    )}

                    {!isHistoryLoading &&
                      !historyQuery.isError &&
                      historyList.map((entry) => (
                        <div
                          key={entry.id}
                          className="grid grid-cols-12 items-center px-1.5 sm:px-2 py-1.5 sm:py-3 rounded text-[10px] sm:text-xs transition-colors bg-slate-900/50 hover:bg-amber-950/30 border border-slate-800/60"
                        >
                          <div className="col-span-4 text-left font-mono text-[9px] sm:text-[10px] text-secondary whitespace-nowrap">
                            <span className="sm:hidden">{formatDateMobile(entry.date)}</span>
                            <span className="hidden sm:inline">
                              {new Date(entry.date)
                                .toLocaleDateString([], { month: 'short', day: '2-digit' })
                                .toUpperCase()}{' '}
                              ·{' '}
                              {new Date(entry.date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="col-span-3 text-left font-mono font-extrabold text-secondary">
                            {entry.score}
                          </div>
                          <div className="col-span-3 text-left font-mono text-[9px] sm:text-[10px] text-secondary whitespace-nowrap">
                            {Math.floor(entry.duration / 60)
                              .toString()
                              .padStart(2, '0')}
                            :{(entry.duration % 60).toString().padStart(2, '0')}
                          </div>
                          <div className="col-span-2 text-left font-sans font-extrabold text-[9px] sm:text-[10px] uppercase">
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
                <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
                  <RoundedButton
                    size="sm"
                    onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                    disabled={histPage <= 1}
                    aria-label="Previous Page"
                  >
                    <img
                      src="/assets/png/default/ui/controls/icon_turn_left.png"
                      alt="Previous"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain"
                    />
                  </RoundedButton>
                  <span className="text-[10px] sm:text-[11px] font-sans font-extrabold uppercase tracking-widest text-secondary">
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
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain"
                    />
                  </RoundedButton>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom Button */}
          <div className="pb-1">
            <WoodenButton
              variant="primary"
              size="lg"
              onClick={onBackToMenu}
              className="w-48 sm:w-56"
            >
              MAIN MENU
            </WoodenButton>
          </div>
        </div>
      </WoodenPanel>
    </div>
  )
}
