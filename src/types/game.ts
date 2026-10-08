export interface GameOptions {
  gameSessionTime: number // in seconds, 60 - 180
  enemySpawnTime: number // in seconds, > 0 (e.g. 1.0 - 10.0)
  selectedShip?: string // e.g. 'ship_1.png' to 'ship_6.png'
}

export interface RankingEntry {
  id: string
  playerId: string
  playerName: string
  score: number
  duration: number // seconds played
  date: string // ISO string
  config: GameOptions
}

export interface MatchHistoryEntry {
  id: string
  playerId: string
  playerName: string
  score: number
  duration: number
  date: string
  endReason: 'victory' | 'destroyed' | 'time_up' | 'abandoned'
  config: GameOptions
  status: 'confirmed' | 'pending' | 'failed'
}

export type NetworkScenario =
  | 'success'
  | 'empty'
  | 'slow'
  | 'error_500'
  | 'timeout'
  | 'delayed_post'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
