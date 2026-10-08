import { delay, HttpResponse, http } from 'msw'
import { useNetworkStore } from '@/lib/network-store'
import type { MatchHistoryEntry, RankingEntry } from '@/types/game'
import { INITIAL_HISTORY_FIXTURES, INITIAL_RANKING_FIXTURES } from './fixtures'

const RANKING_KEY = 'pirate_battle_ranking_db_v3'
const HISTORY_KEY = 'pirate_battle_history_db_v3'

function getStoredRanking(): RankingEntry[] {
  try {
    const raw = localStorage.getItem(RANKING_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load ranking from storage', e)
  }
  saveStoredRanking(INITIAL_RANKING_FIXTURES)
  return INITIAL_RANKING_FIXTURES
}

function saveStoredRanking(data: RankingEntry[]) {
  try {
    localStorage.setItem(RANKING_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save ranking to storage', e)
  }
}

function getStoredHistory(): MatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load history from storage', e)
  }
  saveStoredHistory(INITIAL_HISTORY_FIXTURES)
  return INITIAL_HISTORY_FIXTURES
}

function saveStoredHistory(data: MatchHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save history to storage', e)
  }
}

export function resetMockDatabase() {
  saveStoredRanking(INITIAL_RANKING_FIXTURES)
  saveStoredHistory(INITIAL_HISTORY_FIXTURES)
}

// Handler helper to apply network condition logic
async function applyNetworkConditions() {
  const scenario = useNetworkStore.getState().scenario

  if (scenario === 'slow') {
    await delay(2000)
  }

  if (scenario === 'error_500') {
    return HttpResponse.json({ message: 'Internal Server Error (Simulated)' }, { status: 500 })
  }

  if (scenario === 'timeout') {
    return HttpResponse.json({ message: 'Gateway Timeout (Simulated)' }, { status: 504 })
  }

  return null
}

export const handlers = [
  // GET /api/ranking
  http.get('/api/ranking', async ({ request }) => {
    const err = await applyNetworkConditions()
    if (err) return err

    const scenario = useNetworkStore.getState().scenario
    if (scenario === 'empty') {
      return HttpResponse.json({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })
    }

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '5', 10))
    const gameSessionTimeParam = url.searchParams.get('gameSessionTime')
    const enemySpawnTimeParam = url.searchParams.get('enemySpawnTime')

    let ranking = getStoredRanking()

    if (gameSessionTimeParam) {
      const sessionT = parseInt(gameSessionTimeParam, 10)
      ranking = ranking.filter((r) => r.config.gameSessionTime === sessionT)
    }

    if (enemySpawnTimeParam) {
      const spawnT = parseFloat(enemySpawnTimeParam)
      ranking = ranking.filter((r) => r.config.enemySpawnTime === spawnT)
    }

    // Sort deterministically: score desc, duration desc, date asc
    ranking.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.duration !== a.duration) return b.duration - a.duration
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    const total = ranking.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginated = ranking.slice(startIndex, startIndex + limit)

    return HttpResponse.json({
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    })
  }),

  // GET /api/history
  http.get('/api/history', async ({ request }) => {
    const err = await applyNetworkConditions()
    if (err) return err

    const scenario = useNetworkStore.getState().scenario
    if (scenario === 'empty') {
      return HttpResponse.json({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })
    }

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '5', 10))

    const history = getStoredHistory()
    // Sort history by date desc
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const total = history.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginated = history.slice(startIndex, startIndex + limit)

    return HttpResponse.json({
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    })
  }),

  // POST /api/history
  http.post('/api/history', async ({ request }) => {
    const scenario = useNetworkStore.getState().scenario

    if (scenario === 'delayed_post') {
      await delay(3000)
    }

    const err = await applyNetworkConditions()
    if (err) return err

    const body = (await request.json()) as Partial<MatchHistoryEntry>

    if (!body?.id) {
      return HttpResponse.json({ message: 'Invalid payload: missing id' }, { status: 400 })
    }

    const history = getStoredHistory()
    const ranking = getStoredRanking()

    // Idempotency check: if match ID already exists, return existing entry without duplicating
    const existingHistory = history.find((h) => h.id === body.id)
    if (existingHistory) {
      return HttpResponse.json(existingHistory, { status: 200 })
    }

    const newHistoryEntry: MatchHistoryEntry = {
      id: body.id,
      playerId: body.playerId || 'player',
      playerName: body.playerName || 'Flapjack',
      score: body.score ?? 0,
      duration: body.duration ?? 0,
      date: body.date || new Date().toISOString(),
      endReason: body.endReason || 'time_up',
      config: body.config || { gameSessionTime: 120, enemySpawnTime: 3 },
      status: 'confirmed',
    }

    history.unshift(newHistoryEntry)
    saveStoredHistory(history)

    // Also add to ranking entry
    const newRankEntry: RankingEntry = {
      id: body.id,
      playerId: newHistoryEntry.playerId,
      playerName: newHistoryEntry.playerName,
      score: newHistoryEntry.score,
      duration: newHistoryEntry.duration,
      date: newHistoryEntry.date,
      config: newHistoryEntry.config,
    }

    const existingRankIndex = ranking.findIndex((r) => r.id === body.id)
    if (existingRankIndex >= 0) {
      ranking[existingRankIndex] = newRankEntry
    } else {
      ranking.push(newRankEntry)
    }
    saveStoredRanking(ranking)

    return HttpResponse.json(newHistoryEntry, { status: 201 })
  }),
]
