import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { IslandObstacle } from '@/types/game'

export interface ShipOptions {
  x: number
  y: number
  rotation?: number
  maxHp: number
  shipTexturePath: string
  variant?: number
  isPlayer?: boolean
}

export class Ship {
  public container: Container
  public sprite: Sprite
  public healthBarContainer: Container
  public healthBarFrameSprite!: Sprite
  public healthBarFillSprite!: Sprite
  public healthBarMask!: Graphics
  public fireSprite: Sprite | null = null

  public x: number
  public y: number
  public rotation: number // Angle in radians (0 = Up)
  public hp: number
  public maxHp: number
  public radius = 28
  public isPlayer: boolean
  public isDestroyed = false
  public isDead = false

  public variant = 1
  public hits = 0
  public damageState = 1 // n in {1, 2, 3, 4}

  constructor(options: ShipOptions) {
    this.x = options.x
    this.y = options.y
    this.rotation = options.rotation || 0
    this.maxHp = options.maxHp
    this.hp = options.maxHp
    this.isPlayer = !!options.isPlayer

    // Extract variant (1..6) from options or texture path
    const optionVariant = options.variant
    if (optionVariant && optionVariant >= 1 && optionVariant <= 6) {
      this.variant = optionVariant
    } else {
      const match = options.shipTexturePath.match(/ship_(\d+)/)
      if (match) {
        const num = Number.parseInt(match[1], 10)
        this.variant = ((num - 1) % 6) + 1
      }
    }

    this.container = new Container()
    this.container.x = this.x
    this.container.y = this.y

    const initialTex = this.getTextureForState(1)
    this.sprite = new Sprite(initialTex)
    this.sprite.anchor.set(0.5, 0.5)
    this.sprite.rotation = this.rotation + Math.PI
    this.container.addChild(this.sprite)

    // Health Bar Container (Only for enemy ships, player health is in HUD)
    this.healthBarContainer = new Container()
    this.healthBarContainer.y = -45

    if (!this.isPlayer) {
      const frameTex = this.getEnemyHealthTexture('enemy_health_frame.png')
      const fillTex = this.getEnemyHealthTexture('enemy_health_fill_red.png')

      this.healthBarFrameSprite = new Sprite(frameTex)
      this.healthBarFrameSprite.anchor.set(0.5, 0.5)
      this.healthBarFrameSprite.x = 0
      this.healthBarFrameSprite.y = 0
      this.healthBarFrameSprite.width = 56
      this.healthBarFrameSprite.height = 14

      this.healthBarFillSprite = new Sprite(fillTex)
      this.healthBarFillSprite.anchor.set(0.5, 0.5)
      this.healthBarFillSprite.x = 0
      this.healthBarFillSprite.y = 0
      this.healthBarFillSprite.width = 56
      this.healthBarFillSprite.height = 14

      this.healthBarMask = new Graphics()
      this.healthBarFillSprite.mask = this.healthBarMask

      this.healthBarContainer.addChild(this.healthBarFrameSprite)
      this.healthBarContainer.addChild(this.healthBarFillSprite)
      this.healthBarContainer.addChild(this.healthBarMask)

      this.container.addChild(this.healthBarContainer)
      this.updateHealthBar()
    }
  }

  private getEnemyHealthTexture(fileName: string): Texture {
    try {
      return Texture.from(`/assets/png/retina/ui/hud/${fileName}`)
    } catch (_e) {
      try {
        return Texture.from(`/assets/png/default/ui/hud/${fileName}`)
      } catch (_e2) {
        return Texture.EMPTY
      }
    }
  }

  /**
   * Calculates ship texture index according to f(n) = V + 6 * (n - 1) for variant V (1..6)
   * n = 1: 0 hits (no damage)
   * n = 2: 1 hit (light damage)
   * n = 3: 2 hits (heavy damage)
   * n = 4: 4 hits / dead (0 HP, sunk)
   */
  public getTextureForState(n: number): Texture {
    const shipIdx = this.variant + 6 * (n - 1)
    try {
      return Texture.from(`/assets/png/retina/ships/ship_${shipIdx}.png`)
    } catch (_e) {
      try {
        return Texture.from(`/assets/png/default/ships/ship_${shipIdx}.png`)
      } catch (_e2) {
        return Texture.from('/assets/png/default/ships/ship_1.png')
      }
    }
  }

  public updateShipState() {
    const damageRatio = 1 - Math.max(0, Math.min(1, this.hp / this.maxHp))

    if (this.hp <= 0 || damageRatio >= 0.99) {
      this.damageState = 4 // 100% damage / 0 HP (sunk, stops moving)
      this.hp = 0
      this.isDead = true
      this.isDestroyed = true
    } else if (damageRatio >= 0.5) {
      this.damageState = 3 // 50% or more damage
    } else if (damageRatio >= 0.25) {
      this.damageState = 2 // 25% or more damage
    } else {
      this.damageState = 1 // 0% damage (intact, full HP)
    }

    this.sprite.texture = this.getTextureForState(this.damageState)
  }

  public updateHealthBar() {
    if (!this.healthBarContainer || this.isPlayer) return

    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp))
    if (hpRatio <= 0 || this.isDead || this.isDestroyed) {
      this.healthBarContainer.visible = false
      return
    }
    this.healthBarContainer.visible = true

    // Inside enemy_health_fill_red.png (160x40 at scale 0.35 with anchor 0.5):
    // The red bar spans from x ~24 to 135 (width ~112px in 160px image)
    // Left edge of red fill: (24 - 80) * 0.35 = -19.6
    // Max red fill width: 112 * 0.35 = 39.2
    const startX = -19.6
    const fillWidth = 39.2 * hpRatio

    this.healthBarMask.clear()
    if (fillWidth > 0) {
      this.healthBarMask.rect(startX, -10, fillWidth, 20)
      this.healthBarMask.fill(0xffffff)
    }
  }

  public fireAnimTimer = 0

  public updateFireEffect(deltaSeconds: number) {
    if (this.isDead || this.isDestroyed || this.damageState !== 3) {
      if (this.fireSprite) {
        this.fireSprite.visible = false
      }
      return
    }

    if (!this.fireSprite) {
      try {
        const fireTex = Texture.from('/assets/png/default/effects/fire_1.png')
        this.fireSprite = new Sprite(fireTex)
        this.fireSprite.anchor.set(0.5, 0.85)
        this.container.addChild(this.fireSprite)
      } catch (_e) {
        return
      }
    }

    this.fireSprite.visible = true
    this.fireAnimTimer += deltaSeconds

    // Alternates between fire_1.png and fire_2.png
    const frame = (Math.floor(this.fireAnimTimer * 7) % 2) + 1
    try {
      this.fireSprite.texture = Texture.from(`/assets/png/default/effects/fire_${frame}.png`)
    } catch (_e) {
      // Fallback
    }

    // Position on flag/stern at the rear of the ship
    const sternDist = -20
    this.fireSprite.x = Math.sin(this.rotation) * sternDist
    this.fireSprite.y = -Math.cos(this.rotation) * sternDist
    this.fireSprite.rotation = this.rotation

    // Light pulse animation (scale and alpha)
    const scalePulse = 0.55 + Math.sin(this.fireAnimTimer * 6) * 0.08
    const alphaPulse = 0.8 + Math.sin(this.fireAnimTimer * 4) * 0.2

    this.fireSprite.scale.set(scalePulse)
    this.fireSprite.alpha = Math.max(0.2, Math.min(1.0, alphaPulse))
  }

  public takeDamage(amount: number): boolean {
    if (this.isDestroyed || this.isDead) return false

    this.hits += 1
    this.hp = Math.max(0, this.hp - amount)
    this.updateHealthBar()
    this.updateShipState()

    return this.isDead
  }

  public setPosition(x: number, y: number) {
    if (this.isDead) return
    this.x = x
    this.y = y
    this.container.x = x
    this.container.y = y
  }

  public setRotation(angle: number) {
    if (this.isDead) return
    this.rotation = angle
    this.sprite.rotation = angle + Math.PI
  }

  /**
   * Smoothly steers the ship's rotation towards a target angle.
   */
  public steerTowards(targetAngle: number, deltaSeconds: number, rotationSpeed: number) {
    let angleDiff = targetAngle - this.rotation
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2

    const rotStep = rotationSpeed * deltaSeconds
    if (Math.abs(angleDiff) < rotStep) {
      this.rotation = targetAngle
    } else {
      this.rotation += Math.sign(angleDiff) * rotStep
    }
    this.setRotation(this.rotation)
  }

  /**
   * Clamps ship coordinates within finite arena boundaries.
   */
  public clampToArena(
    x: number,
    y: number,
    arenaWidth: number,
    arenaHeight: number,
  ): { x: number; y: number } {
    if (arenaWidth >= 1e6) return { x, y }
    const margin = this.radius
    const clampedX = Math.max(margin, Math.min(arenaWidth - margin, x))
    const clampedY = Math.max(margin, Math.min(arenaHeight - margin, y))
    return { x: clampedX, y: clampedY }
  }

  /**
   * Resolves physical collisions with island obstacles and pushes ship away.
   */
  public resolveObstacleCollisions(
    targetX: number,
    targetY: number,
    obstacles: IslandObstacle[],
  ): { x: number; y: number; collided: boolean } {
    let resX = targetX
    let resY = targetY
    let collided = false

    obstacles.forEach((obs) => {
      const dx = resX - obs.x
      const dy = resY - obs.y
      const dist = Math.hypot(dx, dy)
      const minDist = this.radius + obs.radius

      if (dist < minDist && dist > 0) {
        collided = true
        const overlap = minDist - dist
        resX += (dx / dist) * overlap
        resY += (dy / dist) * overlap
      }
    })

    return { x: resX, y: resY, collided }
  }

  public destroy(parentContainer: Container) {
    this.isDestroyed = true
    this.isDead = true
    parentContainer.removeChild(this.container)
    this.container.destroy({ children: true })
  }
}
