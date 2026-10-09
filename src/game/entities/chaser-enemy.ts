import { DEFAULT_BALANCE_CONFIG } from '../config/game-config'
import type { IslandObstacle } from '../map/map-generator'
import { Ship } from './ship'

export class ChaserEnemy extends Ship {
  public speed: number
  public rotationSpeed: number
  public collisionDamage: number

  constructor(x: number, y: number, variant?: number) {
    const v = variant || Math.floor(Math.random() * 4) + 1
    super({
      x,
      y,
      rotation: Math.random() * Math.PI * 2,
      maxHp: DEFAULT_BALANCE_CONFIG.chaser.maxHp,
      shipTexturePath: `/assets/png/retina/ships/ship_${v}.png`,
      variant: v,
      isPlayer: false,
    })

    this.container.scale.set(0.5)
    this.radius = DEFAULT_BALANCE_CONFIG.chaser.collisionRadius

    this.speed = DEFAULT_BALANCE_CONFIG.chaser.speed
    this.rotationSpeed = DEFAULT_BALANCE_CONFIG.chaser.rotationSpeed
    this.collisionDamage = DEFAULT_BALANCE_CONFIG.chaser.collisionDamage
  }

  public update(
    deltaSeconds: number,
    target: Ship,
    obstacles: IslandObstacle[],
    arenaWidth: number,
    arenaHeight: number,
  ) {
    if (this.isDestroyed || this.isDead || target.isDestroyed || target.isDead) return

    const dx = target.x - this.x
    const dy = target.y - this.y
    const targetAngle = Math.atan2(dx, -dy)

    let angleDiff = targetAngle - this.rotation
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2

    const rotStep = this.rotationSpeed * deltaSeconds
    if (Math.abs(angleDiff) < rotStep) {
      this.rotation = targetAngle
    } else {
      this.rotation += Math.sign(angleDiff) * rotStep
    }
    this.setRotation(this.rotation)

    let nextX = this.x + Math.sin(this.rotation) * this.speed * deltaSeconds
    let nextY = this.y - Math.cos(this.rotation) * this.speed * deltaSeconds

    if (arenaWidth < 1e6) {
      const margin = this.radius
      nextX = Math.max(margin, Math.min(arenaWidth - margin, nextX))
      nextY = Math.max(margin, Math.min(arenaHeight - margin, nextY))
    }

    obstacles.forEach((obs) => {
      const dist = Math.hypot(nextX - obs.x, nextY - obs.y)
      const minDist = this.radius + obs.radius
      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist
        nextX += ((nextX - obs.x) / dist) * overlap
        nextY += ((nextY - obs.y) / dist) * overlap
      }
    })

    this.setPosition(nextX, nextY)
  }
}
