import type { IslandObstacle } from '@/types/game'
import { DEFAULT_BALANCE_CONFIG } from '../config/game-config'
import { Projectile } from './projectile'
import { Ship } from './ship'

export class ShooterEnemy extends Ship {
  public speed: number
  public rotationSpeed: number
  public fireTimer = 0

  constructor(x: number, y: number, variant?: number) {
    const v = variant || Math.floor(Math.random() * 6) + 1
    super({
      x,
      y,
      rotation: Math.random() * Math.PI * 2,
      maxHp: DEFAULT_BALANCE_CONFIG.shooter.maxHp,
      shipTexturePath: `/assets/png/retina/ships/ship_${v}.png`,
      variant: v,
      isPlayer: false,
    })

    this.speed = DEFAULT_BALANCE_CONFIG.shooter.speed
    this.rotationSpeed = DEFAULT_BALANCE_CONFIG.shooter.rotationSpeed
    this.fireTimer = Math.random() * 1.5
  }

  public update(
    deltaSeconds: number,
    target: Ship,
    obstacles: IslandObstacle[],
    arenaWidth: number,
    arenaHeight: number,
  ): Projectile | null {
    if (this.isDestroyed || this.isDead || target.isDestroyed || target.isDead) return null

    this.fireTimer += deltaSeconds

    const dx = target.x - this.x
    const dy = target.y - this.y
    const distance = Math.hypot(dx, dy)
    const targetAngle = Math.atan2(dx, -dy)

    this.steerTowards(targetAngle, deltaSeconds, this.rotationSpeed)

    let nextX = this.x
    let nextY = this.y

    if (distance > DEFAULT_BALANCE_CONFIG.shooter.desiredDistance) {
      nextX += Math.sin(this.rotation) * this.speed * deltaSeconds
      nextY -= Math.cos(this.rotation) * this.speed * deltaSeconds
    }

    ;({ x: nextX, y: nextY } = this.clampToArena(nextX, nextY, arenaWidth, arenaHeight))
    ;({ x: nextX, y: nextY } = this.resolveObstacleCollisions(nextX, nextY, obstacles))

    this.setPosition(nextX, nextY)

    if (
      distance <= DEFAULT_BALANCE_CONFIG.shooter.attackRange &&
      this.fireTimer >= DEFAULT_BALANCE_CONFIG.shooter.fireCooldown
    ) {
      this.fireTimer = 0

      const spawnX = this.x + Math.sin(this.rotation) * 35
      const spawnY = this.y - Math.cos(this.rotation) * 35

      return new Projectile({
        x: spawnX,
        y: spawnY,
        angle: this.rotation,
        speed: DEFAULT_BALANCE_CONFIG.shooter.projectileSpeed,
        damage: DEFAULT_BALANCE_CONFIG.shooter.projectileDamage,
        lifetime: DEFAULT_BALANCE_CONFIG.shooter.projectileLifetime,
        owner: 'enemy',
        sourceVariant: this.variant,
      })
    }

    return null
  }
}
