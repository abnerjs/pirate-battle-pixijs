import { Application, Container } from 'pixi.js'
import { soundManager } from '@/lib/sound-manager'
import type { GameOptions } from '@/types/game'
import { preloadGameAssets } from './asset-loader'
import { DEFAULT_BALANCE_CONFIG } from './config/game-config'
import { EffectsManager } from './effects/effects-manager'
import { ChaserEnemy } from './entities/chaser-enemy'
import { PlayerShip } from './entities/player-ship'
import { Projectile } from './entities/projectile'
import { ShooterEnemy } from './entities/shooter-enemy'
import { InputController, type InputState } from './input/input-controller'
import { ChunkManager } from './map/chunk-manager'
import { generateMap, type MapData } from './map/map-generator'
import { GarbageCollector } from './systems/garbage-collector'

export interface GameEngineCallbacks {
  onStateUpdate: (state: {
    playerHp: number
    maxHp: number
    score: number
    timeLeft: number
    frontCooldown: number
    leftCooldown: number
    rightCooldown: number
    isPaused: boolean
    isGameOver: boolean
    inputState: InputState
  }) => void
  onEndMatch: (reason: 'victory' | 'destroyed' | 'time_up') => void
}

export class GameEngine {
  public app: Application | null = null
  public input: InputController
  public mapData: MapData | null = null
  public chunkManager: ChunkManager | null = null
  public player: PlayerShip | null = null
  public enemies: (ChaserEnemy | ShooterEnemy)[] = []
  public projectiles: Projectile[] = []
  public effects: EffectsManager | null = null
  public garbageCollector: GarbageCollector | null = null

  public worldContainer: Container | null = null
  public mapContainer: Container | null = null
  public entitiesContainer: Container | null = null
  public projectilesContainer: Container | null = null
  public effectsContainer: Container | null = null

  public config: GameOptions
  public callbacks: GameEngineCallbacks

  public score = 0
  public timeLeft = 120
  public enemySpawnTimer = 0
  public isPaused = false
  public isGameOver = false
  public isMenuMode = false
  private isDestroyed = false
  private resizeObserver: ResizeObserver | null = null

  // Testing mode default false to restore timer countdown and enemy spawning
  public isTestingMode = false

  constructor(config: GameOptions, callbacks: GameEngineCallbacks) {
    this.config = config
    this.callbacks = callbacks
    this.timeLeft = config.gameSessionTime
    this.input = new InputController()
  }

  public async init(containerElement: HTMLElement) {
    const width = containerElement.clientWidth || DEFAULT_BALANCE_CONFIG.arenaWidth
    const height = containerElement.clientHeight || DEFAULT_BALANCE_CONFIG.arenaHeight

    // 1. Preload PixiJS v8 Textures into Cache
    await preloadGameAssets()

    this.app = new Application()
    await this.app.init({
      width,
      height,
      backgroundColor: 0x0f172a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    if (this.isDestroyed || !this.app.canvas) return

    containerElement.appendChild(this.app.canvas as HTMLCanvasElement)

    // Setup Layer Containers
    this.worldContainer = new Container()
    this.mapContainer = new Container()
    this.entitiesContainer = new Container()
    this.mapContainer.cullable = true
    this.entitiesContainer.cullable = true
    this.projectilesContainer = new Container()
    this.effectsContainer = new Container()

    this.worldContainer.addChild(this.mapContainer)
    this.worldContainer.addChild(this.entitiesContainer)
    this.worldContainer.addChild(this.projectilesContainer)
    this.worldContainer.addChild(this.effectsContainer)
    this.app.stage.addChild(this.worldContainer)

    this.effects = new EffectsManager(this.effectsContainer)
    this.garbageCollector = new GarbageCollector(this)

    // Instantiate Infinite Procedural Chunk Manager
    this.chunkManager = new ChunkManager(this.mapContainer)
    this.mapData = generateMap(
      DEFAULT_BALANCE_CONFIG.arenaWidth,
      DEFAULT_BALANCE_CONFIG.arenaHeight,
    )

    // Create Player Ship
    const pSpawn = { x: 2400, y: 1800 }
    const selectedShipTexture = this.config.selectedShip || 'ship_1.png'
    this.player = new PlayerShip(pSpawn.x, pSpawn.y, selectedShipTexture)
    this.entitiesContainer.addChild(this.player.container)

    // Initial Chunk Load Around Player
    this.chunkManager.updatePlayerPosition(this.player.x, this.player.y)

    // Initial Camera Centering on Player
    this.worldContainer.x = width / 2 - this.player.x
    this.worldContainer.y = height / 2 - this.player.y

    // Set up ResizeObserver for dynamic canvas resize without game reset
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect
        if (newW > 0 && newH > 0) {
          this.resize(newW, newH)
        }
      }
    })
    this.resizeObserver.observe(containerElement)

    // Attach Inputs
    this.input.attach()
    this.input.onFrontAttack = () => this.fireFrontWeapon()
    this.input.onLeftBroadside = () => this.fireLeftBroadside()
    this.input.onRightBroadside = () => this.fireRightBroadside()
    this.input.onTogglePause = () => this.togglePause()

    // Start Ticker Loop
    this.app.ticker.add((ticker) => {
      const deltaSeconds = ticker.deltaTime / 60
      this.update(deltaSeconds)
    })

    soundManager.playStart()
  }

  public resize(width: number, height: number) {
    if (!this.app?.renderer || this.isDestroyed) return
    this.app.renderer.resize(width, height)
    if (this.player && this.worldContainer) {
      this.worldContainer.x = width / 2 - this.player.x
      this.worldContainer.y = height / 2 - this.player.y
    }
  }

  public fireFrontWeapon() {
    if (!this.player || this.isPaused || this.isGameOver) return
    const fired = this.player.fireFront()
    if (fired) {
      this.addProjectiles(fired)
      soundManager.playCannonFire()
    }
  }

  public fireLeftBroadside() {
    if (!this.player || this.isPaused || this.isGameOver) return
    const fired = this.player.fireLeftBroadside()
    if (fired) {
      this.addProjectiles(fired)
      soundManager.playBroadside()
    }
  }

  public fireRightBroadside() {
    if (!this.player || this.isPaused || this.isGameOver) return
    const fired = this.player.fireRightBroadside()
    if (fired) {
      this.addProjectiles(fired)
      soundManager.playBroadside()
    }
  }

  private addProjectiles(projs: Projectile[]) {
    if (!this.projectilesContainer) return
    projs.forEach((p) => {
      this.projectiles.push(p)
      this.projectilesContainer?.addChild(p.sprite)
    })
  }

  public togglePause() {
    if (this.isGameOver) return
    this.isPaused = !this.isPaused
    this.notifyStateUpdate()
  }

  public setPaused(paused: boolean) {
    if (this.isGameOver) return
    this.isPaused = paused
    this.notifyStateUpdate()
  }

  private update(deltaSeconds: number) {
    if (this.isPaused || this.isGameOver || !this.player || !this.app || !this.worldContainer)
      return

    if (
      this.player.isDead ||
      this.player.isDestroyed ||
      this.player.damageState === 4 ||
      this.player.hp <= 0
    ) {
      this.endMatch('destroyed')
      return
    }

    // Dynamically update active map chunks around player position
    const activeObstacles = this.chunkManager
      ? this.chunkManager.updatePlayerPosition(this.player.x, this.player.y).obstacles
      : this.mapData?.obstacles || []

    const infiniteBound = 1e8 // Infinite world bounds

    // Update Player Ship (Movement & Islands Collision)
    const inputState = this.input.getInputState()

    this.player.update(deltaSeconds, inputState, activeObstacles, infiniteBound, infiniteBound)
    this.player.updateFireEffect(deltaSeconds)

    // CAMERA FOLLOW WITH 1-SECOND INERTIA (Smooth camera catch-up over 1 second)
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    const targetX = screenWidth / 2 - this.player.x
    const targetY = screenHeight / 2 - this.player.y

    // Smooth lerp: 1 second inertia to reach full speed/matching position
    const cameraDamping = 3.0 // ~95% convergence in 1.0 second
    const lerpFactor = 1 - Math.exp(-cameraDamping * deltaSeconds)

    this.worldContainer.x += (targetX - this.worldContainer.x) * lerpFactor
    this.worldContainer.y += (targetY - this.worldContainer.y) * lerpFactor

    // Active gameplay updates (Timer, Enemies, Wall Cannons, Projectiles)
    if (!this.isMenuMode) {
      if (!this.isTestingMode) {
        this.timeLeft -= deltaSeconds
        if (this.timeLeft <= 0) {
          this.timeLeft = 0
          this.endMatch('time_up')
          return
        }

        this.enemySpawnTimer += deltaSeconds
        if (this.enemySpawnTimer >= this.config.enemySpawnTime) {
          this.enemySpawnTimer = 0
          if (this.enemies.length < 8) {
            this.spawnEnemyAroundPlayer()
          }
        }
      }

      // Update Enemies AI & Movement
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i]
        if (enemy.isDead || enemy.isDestroyed) {
          if (this.entitiesContainer) {
            enemy.destroy(this.entitiesContainer)
          }
          this.enemies.splice(i, 1)
          continue
        }

        enemy.updateFireEffect(deltaSeconds)

        const targetShip = this.getClosestTargetForEnemy(enemy)
        if (!targetShip) continue

        if (enemy instanceof ChaserEnemy) {
          enemy.update(deltaSeconds, targetShip, activeObstacles, infiniteBound, infiniteBound)
        } else if (enemy instanceof ShooterEnemy) {
          const enemyProj = enemy.update(
            deltaSeconds,
            targetShip,
            activeObstacles,
            infiniteBound,
            infiniteBound,
          )
          if (enemyProj) {
            this.addProjectiles([enemyProj])
            soundManager.playCannonFire()
          }
        }

        // Enemy vs Player Ship Collision
        if (
          !this.player.isDead &&
          enemy.variant !== this.player.variant &&
          Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) <
            enemy.radius + this.player.radius
        ) {
          if (enemy instanceof ChaserEnemy) {
            this.player.takeDamage(enemy.collisionDamage)
          } else {
            this.player.takeDamage(16)
          }

          if (this.effects) {
            this.effects.spawnExplosion(enemy.x, enemy.y)
            this.effects.spawnAttackDebris(this.player.x, this.player.y)
            this.effects.spawnAttackDebris(enemy.x, enemy.y)
          }
          soundManager.playExplosion()

          const wasDead = enemy.isDead
          enemy.takeDamage(25)
          if (!wasDead && enemy.isDead) {
            this.score += enemy instanceof ChaserEnemy ? 1 : 5
          }

          if (
            this.player.isDead ||
            this.player.isDestroyed ||
            this.player.damageState === 4 ||
            this.player.hp <= 0
          ) {
            this.endMatch('destroyed')
            return
          }
        }
      }

      // Enemy vs Enemy Physical Collision & Push-Out
      for (let i = 0; i < this.enemies.length; i++) {
        const enemyA = this.enemies[i]
        if (enemyA.isDead || enemyA.isDestroyed) continue

        for (let j = i + 1; j < this.enemies.length; j++) {
          const enemyB = this.enemies[j]
          if (enemyB.isDead || enemyB.isDestroyed) continue

          const dx = enemyB.x - enemyA.x
          const dy = enemyB.y - enemyA.y
          const dist = Math.hypot(dx, dy)
          const minDist = enemyA.radius + enemyB.radius

          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist
            const nx = dx / dist
            const ny = dy / dist

            const pushX = nx * overlap * 0.5
            const pushY = ny * overlap * 0.5

            enemyA.setPosition(enemyA.x - pushX, enemyA.y - pushY)
            enemyB.setPosition(enemyB.x + pushX, enemyB.y + pushY)

            if (enemyA.variant !== enemyB.variant) {
              const damageA = enemyB instanceof ChaserEnemy ? enemyB.collisionDamage : 16
              const damageB = enemyA instanceof ChaserEnemy ? enemyA.collisionDamage : 16

              enemyA.takeDamage(damageA)
              enemyB.takeDamage(damageB)

              if (this.effects) {
                const midX = (enemyA.x + enemyB.x) / 2
                const midY = (enemyA.y + enemyB.y) / 2
                this.effects.spawnExplosion(midX, midY)
                this.effects.spawnAttackDebris(enemyA.x, enemyA.y)
                this.effects.spawnAttackDebris(enemyB.x, enemyB.y)
              }
              soundManager.playExplosion()
            }
          }
        }
      }

      // Update Wall Cannons from active map chunks
      if (this.chunkManager) {
        const activeCannons = this.chunkManager.getActiveWallCannons()
        for (const cannon of activeCannons) {
          cannon.fireTimer += deltaSeconds

          if (cannon.fireTimer >= cannon.cooldown) {
            const targets = []
            if (!this.player.isDead && !this.player.isDestroyed) {
              targets.push(this.player)
            }
            for (const enemy of this.enemies) {
              if (!enemy.isDead && !enemy.isDestroyed) {
                targets.push(enemy)
              }
            }

            let closestTarget = null
            let closestDist = 450

            for (const target of targets) {
              const dx = target.x - cannon.x
              const dy = target.y - cannon.y
              const dist = Math.hypot(dx, dy)

              if (dist <= closestDist) {
                const targetAngle = Math.atan2(dx, -dy)
                let diff = targetAngle - cannon.angle
                while (diff < -Math.PI) diff += Math.PI * 2
                while (diff > Math.PI) diff -= Math.PI * 2

                if (Math.abs(diff) <= Math.PI / 3) {
                  closestDist = dist
                  closestTarget = target
                }
              }
            }

            if (closestTarget) {
              cannon.fireTimer = 0
              const spawnX = cannon.x + Math.sin(cannon.angle) * 35
              const spawnY = cannon.y - Math.cos(cannon.angle) * 35

              const cannonProj = new Projectile({
                x: spawnX,
                y: spawnY,
                angle: cannon.angle,
                speed: 420,
                damage: 12,
                lifetime: 2.0,
                owner: 'enemy',
                sourceVariant: 999,
                isWallCannon: true,
                maxDistance: 512,
              })

              this.addProjectiles([cannonProj])
              soundManager.playCannonFire()
            }
          }
        }
      }

      // Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i]
        p.update(deltaSeconds, infiniteBound, infiniteBound)

        if (p.isExpired) {
          p.destroy(this.projectilesContainer!)
          this.projectiles.splice(i, 1)
          continue
        }

        let hitIsland = false
        if (!p.isWallCannon) {
          for (const obs of activeObstacles) {
            const minDist = p.radius + obs.radius
            if (Math.abs(p.x - obs.x) > minDist || Math.abs(p.y - obs.y) > minDist) continue

            if (Math.hypot(p.x - obs.x, p.y - obs.y) < minDist) {
              hitIsland = true
              if (this.effects) this.effects.spawnWaterSplash(p.x, p.y)
              soundManager.playWaterHit()
              break
            }
          }
        }

        if (hitIsland) {
          p.destroy(this.projectilesContainer!)
          this.projectiles.splice(i, 1)
          continue
        }

        let projHit = false
        const playerMinDist = p.radius + this.player.radius

        if (
          !this.player.isDead &&
          p.sourceVariant !== this.player.variant &&
          Math.abs(p.x - this.player.x) <= playerMinDist &&
          Math.abs(p.y - this.player.y) <= playerMinDist &&
          Math.hypot(p.x - this.player.x, p.y - this.player.y) < playerMinDist
        ) {
          projHit = true
          this.player.takeDamage(p.damage)
          if (this.effects) {
            this.effects.spawnExplosion(p.x, p.y)
            this.effects.spawnAttackDebris(this.player.x, this.player.y)
          }
          soundManager.playExplosion()

          p.destroy(this.projectilesContainer!)
          this.projectiles.splice(i, 1)

          if (
            this.player.isDead ||
            this.player.isDestroyed ||
            this.player.damageState === 4 ||
            this.player.hp <= 0
          ) {
            this.endMatch('destroyed')
            return
          }
          continue
        }

        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const enemy = this.enemies[ei]
          const enemyMinDist = p.radius + enemy.radius

          if (
            !enemy.isDead &&
            p.sourceVariant !== enemy.variant &&
            Math.abs(p.x - enemy.x) <= enemyMinDist &&
            Math.abs(p.y - enemy.y) <= enemyMinDist &&
            Math.hypot(p.x - enemy.x, p.y - enemy.y) < enemyMinDist
          ) {
            projHit = true
            const wasDead = enemy.isDead
            enemy.takeDamage(p.damage)

            if (this.effects) {
              this.effects.spawnExplosion(p.x, p.y)
              this.effects.spawnAttackDebris(enemy.x, enemy.y)
            }
            soundManager.playExplosion()

            p.destroy(this.projectilesContainer!)
            this.projectiles.splice(i, 1)

            if (!wasDead && enemy.isDead && p.owner === 'player') {
              this.score += enemy instanceof ChaserEnemy ? 1 : 5
            }
            break
          }
        }
        if (projHit) continue
      }
    }

    // Update Particle Effects
    if (this.effects) {
      this.effects.update(deltaSeconds)
    }

    // Run Garbage Collector sweep for far entities & assets
    if (this.garbageCollector) {
      this.garbageCollector.update(deltaSeconds)
    }

    this.notifyStateUpdate()
  }

  private getClosestTargetForEnemy(enemy: ChaserEnemy | ShooterEnemy) {
    if (!this.player) return null

    const candidates = [this.player, ...this.enemies].filter(
      (ship) => ship !== enemy && !ship.isDead && ship.variant !== enemy.variant,
    )

    if (candidates.length === 0) return this.player

    let closest = candidates[0]
    let minD = Math.hypot(closest.x - enemy.x, closest.y - enemy.y)

    for (let i = 1; i < candidates.length; i++) {
      const candidate = candidates[i]
      const d = Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y)
      if (d < minD) {
        minD = d
        closest = candidate
      }
    }

    return closest
  }

  private spawnEnemyAroundPlayer() {
    if (!this.player || !this.entitiesContainer || !this.chunkManager) return

    // Calculate player's active chunk coordinates
    const centerCx = Math.floor(this.player.x / this.chunkManager.chunkWidthPx)
    const centerCy = Math.floor(this.player.y / this.chunkManager.chunkWidthPx)

    const chunkWidthPx = this.chunkManager.chunkWidthPx
    const tileSize = this.chunkManager.tileSize

    // Active chunk bounds with 1-tile margin from chunk edges
    const minX = centerCx * chunkWidthPx + tileSize
    const maxX = (centerCx + 1) * chunkWidthPx - tileSize
    const minY = centerCy * chunkWidthPx + tileSize
    const maxY = (centerCy + 1) * chunkWidthPx - tileSize

    const obstacles = this.chunkManager.updatePlayerPosition(this.player.x, this.player.y).obstacles

    let spawnX = this.player.x
    let spawnY = this.player.y
    let validPos = false

    for (let attempt = 0; attempt < 35; attempt++) {
      const rx = minX + Math.random() * (maxX - minX)
      const ry = minY + Math.random() * (maxY - minY)

      // Ensure at least 220px distance from player
      if (Math.hypot(rx - this.player.x, ry - this.player.y) < 220) continue

      let hitObs = false
      for (const obs of obstacles) {
        if (Math.hypot(rx - obs.x, ry - obs.y) < obs.radius + 40) {
          hitObs = true
          break
        }
      }

      if (!hitObs) {
        spawnX = rx
        spawnY = ry
        validPos = true
        break
      }
    }

    if (!validPos) return

    // Ensure enemies are never the same variant as the player
    const playerVar = this.player.variant
    const availableVariants = [1, 2, 3, 4].filter((v) => v !== playerVar)
    const enemyVariant = availableVariants[Math.floor(Math.random() * availableVariants.length)]

    const isChaser = Math.random() < 0.5
    const enemy = isChaser
      ? new ChaserEnemy(spawnX, spawnY, enemyVariant)
      : new ShooterEnemy(spawnX, spawnY, enemyVariant)

    this.enemies.push(enemy)
    this.entitiesContainer.addChild(enemy.container)
  }

  private notifyStateUpdate() {
    const inputState = this.input.getInputState()
    this.callbacks.onStateUpdate({
      playerHp: this.player ? this.player.hp : 0,
      maxHp: this.player ? this.player.maxHp : 100,
      score: this.score,
      timeLeft: Math.ceil(this.timeLeft),
      frontCooldown: this.player ? this.player.frontCooldownTimer : 0,
      leftCooldown: this.player ? this.player.leftBroadsideTimer : 0,
      rightCooldown: this.player ? this.player.rightBroadsideTimer : 0,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      inputState,
    })
  }

  private endMatch(reason: 'victory' | 'destroyed' | 'time_up') {
    this.isGameOver = true
    if (reason === 'destroyed') {
      soundManager.playGameOver()
    } else {
      soundManager.playVictory()
    }
    this.notifyStateUpdate()
    this.callbacks.onEndMatch(reason)
  }

  public setMenuMode(menuMode: boolean) {
    this.isMenuMode = menuMode
    if (menuMode) {
      this.clearEnemiesAndProjectiles()
      if (this.player) {
        this.player.hp = this.player.maxHp
        this.player.isDead = false
        this.player.isDestroyed = false
        this.player.damageState = 1
        this.player.hits = 0
        this.player.sprite.texture = this.player.getTextureForState(1)
        this.player.updateHealthBar()
      }
    }
    this.notifyStateUpdate()
  }

  public startActiveMatch(config?: GameOptions) {
    if (config) {
      this.config = config
      this.timeLeft = config.gameSessionTime
    } else {
      this.timeLeft = this.config.gameSessionTime
    }

    this.isMenuMode = false
    this.isPaused = false
    this.isGameOver = false
    this.score = 0

    if (this.player) {
      this.player.hp = this.player.maxHp
      this.player.isDead = false
      this.player.isDestroyed = false
      this.player.damageState = 1
      this.player.hits = 0
      this.player.sprite.texture = this.player.getTextureForState(1)
      this.player.updateHealthBar()
      this.player.resetTutorial()
    }

    this.clearEnemiesAndProjectiles()
    this.enemySpawnTimer = 0
    this.notifyStateUpdate()
  }

  public updatePlayerShipTexture(shipTextureName: string) {
    if (!this.player) return
    const match = shipTextureName.match(/ship_(\d+)/)
    if (match) {
      const num = Number.parseInt(match[1], 10)
      this.player.variant = ((num - 1) % 4) + 1
      this.player.sprite.texture = this.player.getTextureForState(this.player.damageState)
    }
  }

  private clearEnemiesAndProjectiles() {
    for (const enemy of this.enemies) {
      if (this.entitiesContainer) {
        enemy.destroy(this.entitiesContainer)
      }
    }
    this.enemies = []

    for (const p of this.projectiles) {
      if (this.projectilesContainer) {
        p.destroy(this.projectilesContainer!)
      }
    }
    this.projectiles = []

    if (this.effects) {
      this.effects.clear()
    }
  }

  public destroy() {
    this.isDestroyed = true
    this.input.detach()

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.effects) {
      this.effects.clear()
    }

    if (this.app) {
      try {
        this.app.destroy(true, { children: true, texture: false })
      } catch (_e) {
        // Safe PixiJS cleanup
      }
      this.app = null
    }
  }
}
