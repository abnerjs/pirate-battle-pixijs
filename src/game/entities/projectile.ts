import { Container, Sprite, Texture } from 'pixi.js'
import { getLoadedTexture } from '../asset-loader'

export interface ProjectileOptions {
  x: number
  y: number
  angle: number
  speed: number
  damage: number
  lifetime: number
  owner: 'player' | 'enemy'
  sourceVariant?: number
  maxDistance?: number
  isWallCannon?: boolean
}

export class Projectile {
  public sprite: Sprite
  public x: number
  public y: number
  public startX: number
  public startY: number
  public vx: number
  public vy: number
  public speed: number
  public damage: number
  public lifetime: number
  public maxLifetime: number
  public owner: 'player' | 'enemy'
  public sourceVariant: number
  public isExpired = false
  public radius = 6
  public maxDistance: number
  public isWallCannon: boolean

  constructor(options: ProjectileOptions) {
    this.x = options.x
    this.y = options.y
    this.startX = options.x
    this.startY = options.y
    this.speed = options.speed
    this.damage = options.damage
    this.lifetime = options.lifetime
    this.maxLifetime = options.lifetime
    this.owner = options.owner
    this.sourceVariant = options.sourceVariant || 1
    // Player and Wall Cannon projectiles travel max 4 tiles (4 * 128 = 512px)
    this.maxDistance =
      options.maxDistance || (options.owner === 'player' || options.isWallCannon ? 512 : 1200)
    this.isWallCannon = !!options.isWallCannon

    this.vx = Math.sin(options.angle) * options.speed
    this.vy = -Math.cos(options.angle) * options.speed

    const texture: Texture = getLoadedTexture('/assets/png/default/ship_parts/cannon_ball.png')

    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5, 0.5)
    this.sprite.width = 12
    this.sprite.height = 12
    this.sprite.x = this.x
    this.sprite.y = this.y
    this.sprite.rotation = options.angle
  }

  public update(deltaSeconds: number, boundsWidth: number, boundsHeight: number) {
    if (this.isExpired) return

    this.x += this.vx * deltaSeconds
    this.y += this.vy * deltaSeconds
    this.lifetime -= deltaSeconds

    this.sprite.x = this.x
    this.sprite.y = this.y

    // Distance traveled calculated via scalar multiplication (speed * elapsed), avoiding hypot/sqrt
    const elapsedTime = this.maxLifetime - this.lifetime
    const distanceTraveled = this.speed * elapsedTime

    if (
      this.lifetime <= 0 ||
      distanceTraveled >= this.maxDistance ||
      (boundsWidth < 1e6 &&
        (this.x < 0 || this.x > boundsWidth || this.y < 0 || this.y > boundsHeight))
    ) {
      this.isExpired = true
    }
  }

  public destroy(container: Container) {
    container.removeChild(this.sprite)
    this.sprite.destroy()
  }
}
