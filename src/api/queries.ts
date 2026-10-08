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

export function useSaveMatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (match: MatchHistoryEntry) => {
      try {
        const result = await saveMatchResult(match)
        removePendingMatch(match.id)
        return result
      } catch (err) {
        // Save to pending queue if network request fails
        savePendingMatch(match)
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANKING_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
    },
  })
}
