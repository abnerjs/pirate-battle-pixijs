import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MatchHistoryEntry } from '@/types/game'
import { fetchMatchHistory, fetchRanking, saveMatchResult } from './client'

export const RANKING_QUERY_KEY = ['ranking']
export const HISTORY_QUERY_KEY = ['history']

export function useRankingQuery(
  page: number,
  limit = 5,
  gameSessionTime?: number,
  enemySpawnTime?: number,
) {
  return useQuery({
    queryKey: [...RANKING_QUERY_KEY, page, limit, gameSessionTime, enemySpawnTime],
    queryFn: () => fetchRanking(page, limit, gameSessionTime, enemySpawnTime),
    staleTime: 5000,
    retry: 1,
  })
}

export function useMatchHistoryQuery(page: number, limit = 5) {
  return useQuery({
    queryKey: [...HISTORY_QUERY_KEY, page, limit],
    queryFn: () => fetchMatchHistory(page, limit),
    staleTime: 5000,
    retry: 1,
  })
}

// Helper to handle pending match uploads stored locally
const PENDING_MATCHES_KEY = 'pirate_battle_pending_matches_v1'

export function getPendingMatches(): MatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(PENDING_MATCHES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to get pending matches', e)
  }
  return []
}

export function savePendingMatch(match: MatchHistoryEntry) {
  try {
    const pending = getPendingMatches()
    if (!pending.some((m) => m.id === match.id)) {
      pending.push({ ...match, status: 'pending' })
      localStorage.setItem(PENDING_MATCHES_KEY, JSON.stringify(pending))
    }
  } catch (e) {
    console.error('Failed to save pending match', e)
  }
}

export function removePendingMatch(matchId: string) {
  try {
    const pending = getPendingMatches().filter((m) => m.id !== matchId)
    localStorage.setItem(PENDING_MATCHES_KEY, JSON.stringify(pending))
  } catch (e) {
    console.error('Failed to remove pending match', e)
  }
}

export function saveOfflineMatchResult(match: MatchHistoryEntry) {
  savePendingMatch(match)
  try {
    const historyKey = 'pirate_battle_history_db_v3'
    const rawHistory = localStorage.getItem(historyKey)
    const history: MatchHistoryEntry[] = rawHistory ? JSON.parse(rawHistory) : []
    if (!history.some((h) => h.id === match.id)) {
      history.unshift({ ...match, status: 'confirmed' })
      localStorage.setItem(historyKey, JSON.stringify(history))
    }

    const rankingKey = 'pirate_battle_ranking_db_v3'
    const rawRanking = localStorage.getItem(rankingKey)
    const ranking = rawRanking ? JSON.parse(rawRanking) : []
    if (!ranking.some((r: { id: string }) => r.id === match.id)) {
      ranking.push({
        id: match.id,
        playerId: match.playerId,
        playerName: match.playerName,
        score: match.score,
        duration: match.duration,
        date: match.date,
        config: match.config,
      })
      localStorage.setItem(rankingKey, JSON.stringify(ranking))
    }
  } catch (e) {
    console.error('Failed to save match offline', e)
  }
}

import { INITIAL_HISTORY_FIXTURES, INITIAL_RANKING_FIXTURES } from '@/mocks/fixtures'

export function getOfflineRanking(
  page = 1,
  limit = 5,
  gameSessionTime?: number,
  enemySpawnTime?: number,
) {
  try {
    const rankingKey = 'pirate_battle_ranking_db_v3'
    const rawRanking = localStorage.getItem(rankingKey)
    let ranking = rawRanking ? JSON.parse(rawRanking) : []

    if (!Array.isArray(ranking) || ranking.length === 0) {
      ranking = INITIAL_RANKING_FIXTURES
      try {
        localStorage.setItem(rankingKey, JSON.stringify(INITIAL_RANKING_FIXTURES))
      } catch (_e) {}
    }

    if (gameSessionTime !== undefined) {
      const filtered = ranking.filter(
        (r: { config?: { gameSessionTime?: number } }) =>
          !r.config ||
          r.config.gameSessionTime === undefined ||
          r.config.gameSessionTime === gameSessionTime,
      )
      if (filtered.length > 0) {
        ranking = filtered
      }
    }

    if (enemySpawnTime !== undefined) {
      const filtered = ranking.filter(
        (r: { config?: { enemySpawnTime?: number } }) =>
          !r.config ||
          r.config.enemySpawnTime === undefined ||
          r.config.enemySpawnTime === enemySpawnTime,
      )
      if (filtered.length > 0) {
        ranking = filtered
      }
    }

    ranking.sort(
      (
        a: { score: number; duration: number; date: string },
        b: { score: number; duration: number; date: string },
      ) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.duration !== a.duration) return b.duration - a.duration
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      },
    )

    const total = ranking.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const startIndex = (page - 1) * limit
    const paginated = ranking.slice(startIndex, startIndex + limit)

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (e) {
    console.error('Failed to get offline ranking', e)
    return {
      data: INITIAL_RANKING_FIXTURES.slice(0, limit),
      total: INITIAL_RANKING_FIXTURES.length,
      page: 1,
      limit,
      totalPages: Math.ceil(INITIAL_RANKING_FIXTURES.length / limit),
    }
  }
}

export function getOfflineMatchHistory(page = 1, limit = 5) {
  try {
    const historyKey = 'pirate_battle_history_db_v3'
    const rawHistory = localStorage.getItem(historyKey)
    let history: MatchHistoryEntry[] = rawHistory ? JSON.parse(rawHistory) : []

    if (!Array.isArray(history) || history.length === 0) {
      history = INITIAL_HISTORY_FIXTURES
      try {
        localStorage.setItem(historyKey, JSON.stringify(INITIAL_HISTORY_FIXTURES))
      } catch (_e) {}
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const total = history.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const startIndex = (page - 1) * limit
    const paginated = history.slice(startIndex, startIndex + limit)

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (e) {
    console.error('Failed to get offline match history', e)
    return {
      data: INITIAL_HISTORY_FIXTURES.slice(0, limit),
      total: INITIAL_HISTORY_FIXTURES.length,
      page: 1,
      limit,
      totalPages: Math.ceil(INITIAL_HISTORY_FIXTURES.length / limit),
    }
  }
}

export function useSaveMatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (match: MatchHistoryEntry) => {
      try {
        const result = await saveMatchResult(match)
        removePendingMatch(match.id)
        return result
      } catch (_err) {
        saveOfflineMatchResult(match)
        return match
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANKING_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
    },
  })
}
