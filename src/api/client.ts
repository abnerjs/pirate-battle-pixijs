import axios from 'axios'
import type { MatchHistoryEntry, PaginatedResponse, RankingEntry } from '@/types/game'

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

import { getOfflineMatchHistory, getOfflineRanking } from './queries'

export async function fetchRanking(
  page = 1,
  limit = 5,
  gameSessionTime?: number,
  enemySpawnTime?: number,
): Promise<PaginatedResponse<RankingEntry>> {
  const params: Record<string, number> = { page, limit }
  if (gameSessionTime !== undefined) params.gameSessionTime = gameSessionTime
  if (enemySpawnTime !== undefined) params.enemySpawnTime = enemySpawnTime

  try {
    const response = await apiClient.get<PaginatedResponse<RankingEntry>>('/api/ranking', {
      params,
    })
    return response.data
  } catch (err) {
    console.warn('fetchRanking failed, falling back to local storage:', err)
    return getOfflineRanking(page, limit, gameSessionTime, enemySpawnTime)
  }
}

export async function fetchMatchHistory(
  page = 1,
  limit = 5,
): Promise<PaginatedResponse<MatchHistoryEntry>> {
  try {
    const response = await apiClient.get<PaginatedResponse<MatchHistoryEntry>>('/api/history', {
      params: { page, limit },
    })
    return response.data
  } catch (err) {
    console.warn('fetchMatchHistory failed, falling back to local storage:', err)
    return getOfflineMatchHistory(page, limit)
  }
}

export async function saveMatchResult(match: MatchHistoryEntry): Promise<MatchHistoryEntry> {
  const response = await apiClient.post<MatchHistoryEntry>('/api/history', match)
  return response.data
}
