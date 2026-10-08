import axios from 'axios'
import type { MatchHistoryEntry, PaginatedResponse, RankingEntry } from '@/types/game'

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export async function fetchRanking(page = 1, limit = 5): Promise<PaginatedResponse<RankingEntry>> {
  const response = await apiClient.get<PaginatedResponse<RankingEntry>>('/api/ranking', {
    params: { page, limit },
  })
  return response.data
}

export async function fetchMatchHistory(
  page = 1,
  limit = 5,
): Promise<PaginatedResponse<MatchHistoryEntry>> {
  const response = await apiClient.get<PaginatedResponse<MatchHistoryEntry>>('/api/history', {
    params: { page, limit },
  })
  return response.data
}

export async function saveMatchResult(match: MatchHistoryEntry): Promise<MatchHistoryEntry> {
  const response = await apiClient.post<MatchHistoryEntry>('/api/history', match)
  return response.data
}
