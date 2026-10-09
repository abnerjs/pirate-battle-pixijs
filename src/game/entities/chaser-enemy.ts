import type { IslandObstacle } from '@/types/game'
import { DEFAULT_BALANCE_CONFIG } from '../config/game-config'
import { Ship } from './ship'

export class ChaserEnemy extends Ship {
  public speed: number
  public rotationSpeed: number
  public collisionDamage: number

  constructor(x: number, y: number, variant?: number) {
    const v = variant || Math.floor(Math.random() * 6) + 1
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

    const targetAngle = Math.atan2(target.x - this.x, -(target.y - this.y))
    this.steerTowards(targetAngle, deltaSeconds, this.rotationSpeed)

    let nextX = this.x + Math.sin(this.rotation) * this.speed * deltaSeconds
    let nextY = this.y - Math.cos(this.rotation) * this.speed * deltaSeconds

    ;({ x: nextX, y: nextY } = this.clampToArena(nextX, nextY, arenaWidth, arenaHeight))
    ;({ x: nextX, y: nextY } = this.resolveObstacleCollisions(nextX, nextY, obstacles))

    this.setPosition(nextX, nextY)
  }
}
