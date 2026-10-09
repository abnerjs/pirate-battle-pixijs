import { Container, Sprite, Texture } from 'pixi.js'

export interface ProjectileOptions {
  x: number
  y: number
  angle: number
  speed: number
  damage: number
  lifetime: number
  owner: 'player' | 'enemy'
}

export class Projectile {
  public sprite: Sprite
  public x: number
  public y: number
  public vx: number
  public vy: number
  public damage: number
  public lifetime: number
  public owner: 'player' | 'enemy'
  public isExpired = false
  public radius = 6

  constructor(options: ProjectileOptions) {
    this.x = options.x
    this.y = options.y
    this.damage = options.damage
    this.lifetime = options.lifetime
    this.owner = options.owner

    this.vx = Math.sin(options.angle) * options.speed
    this.vy = -Math.cos(options.angle) * options.speed

    let texture: Texture
    try {
      texture = Texture.from('/assets/png/default/ship_parts/cannon_ball.png')
    } catch (_e) {
      texture = Texture.WHITE
    }

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

    if (
      this.lifetime <= 0 ||
      this.x < 0 ||
      this.x > boundsWidth ||
      this.y < 0 ||
      this.y > boundsHeight
    ) {
      this.isExpired = true
    }
  }

  public destroy(container: Container) {
    container.removeChild(this.sprite)
    this.sprite.destroy()
  }
}
