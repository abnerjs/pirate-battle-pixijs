import type { GameEngine } from '../game-engine'

export interface GarbageCollectorOptions {
  sweepIntervalSeconds?: number
  maxEnemyDistance?: number
  maxProjectileDistance?: number
  maxEffectDistance?: number
  maxChunkRadius?: number
}

/**
 * Game Engine Asset & Entity Garbage Collector System.
 * Periodically sweeps and purges entities, particles, projectiles, and map metadata
 * that are outside active player viewport range to keep memory and CPU usage optimal.
 */
export class GarbageCollector {
  private engine: GameEngine
  private timer = 0
  private sweepInterval = 2.0 // Run GC every 2 seconds
  private maxEnemyDistance = 2500 // 2500px radius (~10 chunks)
  private maxProjectileDistance = 1800 // 1800px radius
  private maxEffectDistance = 1800 // 1800px radius
  private maxChunkRadius = 6 // 6 chunks radius (~12,000px)

  // GC Statistics / Metrics
  public totalEnemiesPurged = 0
  public totalProjectilesPurged = 0
  public totalEffectsPurged = 0

  constructor(engine: GameEngine, options?: GarbageCollectorOptions) {
    this.engine = engine
    if (options?.sweepIntervalSeconds) this.sweepInterval = options.sweepIntervalSeconds
    if (options?.maxEnemyDistance) this.maxEnemyDistance = options.maxEnemyDistance
    if (options?.maxProjectileDistance) this.maxProjectileDistance = options.maxProjectileDistance
    if (options?.maxEffectDistance) this.maxEffectDistance = options.maxEffectDistance
    if (options?.maxChunkRadius) this.maxChunkRadius = options.maxChunkRadius
  }

  public update(deltaSeconds: number) {
    this.timer += deltaSeconds
    if (this.timer >= this.sweepInterval) {
      this.timer = 0
      this.collect()
    }
  }

  public collect() {
    const player = this.engine.player
    if (!player) return

    const px = player.x
    const py = player.y

    // 1. Garbage Collect Distant / Dead Enemies
    for (let i = this.engine.enemies.length - 1; i >= 0; i--) {
      const enemy = this.engine.enemies[i]
      const dist = Math.hypot(enemy.x - px, enemy.y - py)

      if (enemy.isDead || enemy.isDestroyed || dist > this.maxEnemyDistance) {
        if (this.engine.entitiesContainer) {
          enemy.destroy(this.engine.entitiesContainer)
        }
        this.engine.enemies.splice(i, 1)
        this.totalEnemiesPurged++
      }
    }

    // 2. Garbage Collect Distant / Expired Projectiles
    for (let i = this.engine.projectiles.length - 1; i >= 0; i--) {
      const proj = this.engine.projectiles[i]
      const dist = Math.hypot(proj.x - px, proj.y - py)

      if (proj.isExpired || dist > this.maxProjectileDistance) {
        if (this.engine.projectilesContainer) {
          proj.destroy(this.engine.projectilesContainer)
        }
        this.engine.projectiles.splice(i, 1)
        this.totalProjectilesPurged++
      }
    }

    // 3. Garbage Collect Far Effects / Floating Debris
    if (this.engine.effects) {
      const pruned = this.engine.effects.purgeFarEffects(px, py, this.maxEffectDistance)
      this.totalEffectsPurged += pruned
    }

    // 4. Garbage Collect Far Map Metadata in ChunkManager
    if (this.engine.chunkManager) {
      const centerCx = Math.floor(px / this.engine.chunkManager.chunkWidthPx)
      const centerCy = Math.floor(py / this.engine.chunkManager.chunkWidthPx)
      this.engine.chunkManager.purgeFarMetadata(centerCx, centerCy, this.maxChunkRadius)
    }
  }

  public resetMetrics() {
    this.totalEnemiesPurged = 0
    this.totalProjectilesPurged = 0
    this.totalEffectsPurged = 0
  }
}
