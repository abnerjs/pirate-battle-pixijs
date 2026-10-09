import { Application, Container } from 'pixi.js'
import { soundManager } from '@/lib/sound-manager'
import type { GameOptions } from '@/types/game'
import { preloadGameAssets } from './asset-loader'
import { DEFAULT_BALANCE_CONFIG } from './config/game-config'
import { EffectsManager } from './effects/effects-manager'
import { ChaserEnemy } from './entities/chaser-enemy'
import { PlayerShip } from './entities/player-ship'
import type { Projectile } from './entities/projectile'
import { ShooterEnemy } from './entities/shooter-enemy'
import { InputController, type InputState } from './input/input-controller'
import { generateMap, type MapData } from './map/map-generator'

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
  public player: PlayerShip | null = null
  public enemies: (ChaserEnemy | ShooterEnemy)[] = []
  public projectiles: Projectile[] = []
  public effects: EffectsManager | null = null

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
  private isDestroyed = false
  private resizeObserver: ResizeObserver | null = null

  // Pause enemies and timer for testing mode as requested by user
  public isTestingMode = true

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
    this.projectilesContainer = new Container()
    this.effectsContainer = new Container()

    this.worldContainer.addChild(this.mapContainer)
    this.worldContainer.addChild(this.entitiesContainer)
    this.worldContainer.addChild(this.projectilesContainer)
    this.worldContainer.addChild(this.effectsContainer)
    this.app.stage.addChild(this.worldContainer)

    this.effects = new EffectsManager(this.effectsContainer)

    // Generate Map & Islands
    this.mapData = generateMap(
      DEFAULT_BALANCE_CONFIG.arenaWidth,
      DEFAULT_BALANCE_CONFIG.arenaHeight,
    )
    this.mapContainer.addChild(this.mapData.container)

    // Create Player Ship using selectedShip option
    const pSpawn = this.mapData.playerSpawn
    const selectedShipTexture = this.config.selectedShip || 'ship_1.png'
    this.player = new PlayerShip(pSpawn.x, pSpawn.y, selectedShipTexture)
    this.entitiesContainer.addChild(this.player.container)

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
    if (
      this.isPaused ||
      this.isGameOver ||
      !this.mapData ||
      !this.player ||
      !this.app ||
      !this.worldContainer
    )
      return

    // Update Player Ship (Movement & Islands Collision)
    const inputState = this.input.getInputState()
    this.player.update(
      deltaSeconds,
      inputState,
      this.mapData.obstacles,
      this.mapData.width,
      this.mapData.height,
    )

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

    // Non-testing mode updates (Timer, Enemies)
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
        // Enemy spawning
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      p.update(deltaSeconds, this.mapData.width, this.mapData.height)

      if (p.isExpired) {
        p.destroy(this.projectilesContainer!)
        this.projectiles.splice(i, 1)
        continue
      }

      // Projectile vs Island Obstacles
      let hitIsland = false
      for (const obs of this.mapData.obstacles) {
        if (Math.hypot(p.x - obs.x, p.y - obs.y) < p.radius + obs.radius) {
          hitIsland = true
          if (this.effects) this.effects.spawnWaterSplash(p.x, p.y)
          soundManager.playWaterHit()
          break
        }
      }

      if (hitIsland) {
        p.destroy(this.projectilesContainer!)
        this.projectiles.splice(i, 1)
      }
    }

    // Update Particle Effects
    if (this.effects) {
      this.effects.update(deltaSeconds)
    }

    this.notifyStateUpdate()
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
