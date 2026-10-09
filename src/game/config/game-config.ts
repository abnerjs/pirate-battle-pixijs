export interface GameBalanceConfig {
  arenaWidth: number
  arenaHeight: number
  tileSize: number

  playerMaxHp: number
  playerSpeed: number
  playerRotationSpeed: number

  frontWeapon: {
    cooldown: number
    damage: number
    speed: number
    lifetime: number
    spread: number
  }
  sideWeapon: {
    cooldown: number
    damage: number
    speed: number
    lifetime: number
    spread: number
  }

  chaser: {
    maxHp: number
    speed: number
    rotationSpeed: number
    collisionDamage: number
    collisionRadius: number
  }
  shooter: {
    maxHp: number
    speed: number
    rotationSpeed: number
    attackRange: number
    desiredDistance: number
    fireCooldown: number
    projectileDamage: number
    projectileSpeed: number
    projectileLifetime: number
  }
}

export const DEFAULT_BALANCE_CONFIG: GameBalanceConfig = {
  arenaWidth: 4800,
  arenaHeight: 3600,
  tileSize: 128,

  playerMaxHp: 100,
  playerSpeed: 230,
  playerRotationSpeed: 3.2,

  frontWeapon: {
    cooldown: 0.6,
    damage: 25,
    speed: 550,
    lifetime: 2.0,
    spread: 0,
  },
  sideWeapon: {
    cooldown: 1.5,
    damage: 25,
    speed: 480,
    lifetime: 1.8,
    spread: 0.15,
  },

  chaser: {
    maxHp: 25,
    speed: 184, // 80% of player speed (230 * 0.8 = 184)
    rotationSpeed: 3.2,
    collisionDamage: 25,
    collisionRadius: 14,
  },
  shooter: {
    maxHp: 100,
    speed: 60,
    rotationSpeed: 1.0,
    attackRange: 380,
    desiredDistance: 280,
    fireCooldown: 2.0,
    projectileDamage: 8,
    projectileSpeed: 400,
    projectileLifetime: 2.2,
  },
}
