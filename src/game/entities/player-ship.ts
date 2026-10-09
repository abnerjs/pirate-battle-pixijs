import { Container, Sprite, Text, Texture } from 'pixi.js'
import type { IslandObstacle } from '@/types/game'
import { DEFAULT_BALANCE_CONFIG } from '../config/game-config'
import { Projectile } from './projectile'
import { Ship } from './ship'

export class PlayerShip extends Ship {
  public speed: number
  public maxSpeed: number
  public currentSpeed = 0
  public rotationSpeed: number

  public frontCooldownTimer = 0
  public leftBroadsideTimer = 0
  public rightBroadsideTimer = 0

  public tutorialTimer = 3.0
  public tutorialElapsed = 0
  public tutorialContainer: Container | null = null

  constructor(x: number, y: number, shipTexture = 'ship_1.png') {
    const cleanTextureName = shipTexture.includes('/')
      ? shipTexture.split('/').pop() || 'ship_1.png'
      : shipTexture

    super({
      x,
      y,
      rotation: 0,
      maxHp: DEFAULT_BALANCE_CONFIG.playerMaxHp,
      shipTexturePath: `/assets/png/retina/ships/${cleanTextureName}`,
      isPlayer: true,
    })

    this.speed = DEFAULT_BALANCE_CONFIG.playerSpeed
    this.maxSpeed = DEFAULT_BALANCE_CONFIG.playerSpeed
    this.rotationSpeed = DEFAULT_BALANCE_CONFIG.playerRotationSpeed

    this.setupTutorialPrompts()
  }

  private setupTutorialPrompts() {
    this.tutorialContainer = new Container()

    let buttonTex: Texture
    try {
      buttonTex = Texture.from('/assets/png/default/ui/controls/button_round_normal.png')
    } catch (_e) {
      buttonTex = Texture.EMPTY
    }

    const createPrompt = (x: number, y: number, labelText: string) => {
      const group = new Container()
      group.x = x
      group.y = y

      // Round button texture background
      const btnSprite = new Sprite(buttonTex)
      btnSprite.anchor.set(0.5, 0.5)
      btnSprite.width = 44
      btnSprite.height = 44
      btnSprite.tint = 0xb0b0b0 // Disabled / grayed out wooden round button look
      btnSprite.alpha = 0.9
      group.addChild(btnSprite)

      // Key label text overlay (light theme secondary cream color)
      const text = new Text({
        text: labelText,
        style: {
          fontFamily: 'system-ui, sans-serif',
          fontSize: labelText.length > 2 ? 10 : 16,
          fontWeight: '900',
          fill: 0xf5e6ca,
          stroke: { color: 0x1c130d, width: 2 },
        },
      })
      text.anchor.set(0.5, 0.5)
      group.addChild(text)

      return group
    }

    // Front: SPACE key on round button background (y = -90, spaced further ahead of bow)
    const frontPrompt = createPrompt(0, -90, 'SPACE')
    // Left: Q key on round button background (x = -90, spaced further on left flank)
    const leftPrompt = createPrompt(-90, 0, 'Q')
    // Right: E key on round button background (x = 90, spaced further on right flank)
    const rightPrompt = createPrompt(90, 0, 'E')

    this.tutorialContainer.addChild(frontPrompt)
    this.tutorialContainer.addChild(leftPrompt)
    this.tutorialContainer.addChild(rightPrompt)

    this.container.addChild(this.tutorialContainer)
  }

  public resetTutorial() {
    this.tutorialTimer = 3.0
    this.tutorialElapsed = 0
    if (this.tutorialContainer) {
      this.tutorialContainer.visible = true
      this.tutorialContainer.alpha = 1.0
      this.tutorialContainer.scale.set(1.0)
    }
  }

  public update(
    deltaSeconds: number,
    inputs: { moveForward: boolean; turnLeft: boolean; turnRight: boolean },
    obstacles: IslandObstacle[],
    arenaWidth: number,
    arenaHeight: number,
    isMenuMode = false,
  ) {
    if (this.isDestroyed || this.isDead || this.damageState === 4) return

    // Update 3-second tutorial prompts (pulsing disabled buttons around player ship)
    if (!isMenuMode && this.tutorialTimer > 0 && this.tutorialContainer) {
      this.tutorialTimer -= deltaSeconds
      this.tutorialElapsed += deltaSeconds

      const pulse = 1.0 + Math.sin(this.tutorialElapsed * 8) * 0.12
      this.tutorialContainer.scale.set(pulse)

      if (this.tutorialTimer < 0.5) {
        this.tutorialContainer.alpha = Math.max(0, this.tutorialTimer / 0.5)
      }

      if (this.tutorialTimer <= 0) {
        this.tutorialContainer.visible = false
      }
    }

    this.frontCooldownTimer = Math.max(0, this.frontCooldownTimer - deltaSeconds)
    this.leftBroadsideTimer = Math.max(0, this.leftBroadsideTimer - deltaSeconds)
    this.rightBroadsideTimer = Math.max(0, this.rightBroadsideTimer - deltaSeconds)

    if (inputs.turnLeft) {
      this.rotation -= this.rotationSpeed * deltaSeconds
    }
    if (inputs.turnRight) {
      this.rotation += this.rotationSpeed * deltaSeconds
    }
    this.setRotation(this.rotation)

    // Deceleration physics: Acceleration up to maxSpeed, deceleration to 0 over 2 seconds
    const acceleration = this.maxSpeed / 0.4 // Reaches max speed in 0.4s
    const deceleration = this.maxSpeed / 2.0 // Decelerates to 0 over exactly 2 seconds

    if (inputs.moveForward) {
      this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + acceleration * deltaSeconds)
    } else {
      this.currentSpeed = Math.max(0, this.currentSpeed - deceleration * deltaSeconds)
    }

    let nextX = this.x
    let nextY = this.y

    if (this.currentSpeed > 0) {
      const vx = Math.sin(this.rotation) * this.currentSpeed * deltaSeconds
      const vy = -Math.cos(this.rotation) * this.currentSpeed * deltaSeconds

      nextX += vx
      nextY += vy
    }

    ;({ x: nextX, y: nextY } = this.clampToArena(nextX, nextY, arenaWidth, arenaHeight))

    const collision = this.resolveObstacleCollisions(nextX, nextY, obstacles)
    nextX = collision.x
    nextY = collision.y
    if (collision.collided) {
      // Dampen momentum speed slightly on obstacle collision
      this.currentSpeed *= 0.5
    }

    this.setPosition(nextX, nextY)
  }

  public fireFront(): Projectile[] | null {
    if (this.frontCooldownTimer > 0 || this.isDestroyed) return null

    this.frontCooldownTimer = DEFAULT_BALANCE_CONFIG.frontWeapon.cooldown

    const spawnDist = 40
    const spawnX = this.x + Math.sin(this.rotation) * spawnDist
    const spawnY = this.y - Math.cos(this.rotation) * spawnDist

    return [
      new Projectile({
        x: spawnX,
        y: spawnY,
        angle: this.rotation,
        speed: DEFAULT_BALANCE_CONFIG.frontWeapon.speed,
        damage: DEFAULT_BALANCE_CONFIG.frontWeapon.damage,
        lifetime: DEFAULT_BALANCE_CONFIG.frontWeapon.lifetime,
        owner: 'player',
        sourceVariant: this.variant,
      }),
    ]
  }

  public fireLeftBroadside(): Projectile[] | null {
    if (this.leftBroadsideTimer > 0 || this.isDestroyed || this.isDead) return null

    this.leftBroadsideTimer = DEFAULT_BALANCE_CONFIG.sideWeapon.cooldown
    const leftAngle = this.rotation - Math.PI / 2

    return this.createBroadsideProjectiles(leftAngle)
  }

  public fireRightBroadside(): Projectile[] | null {
    if (this.rightBroadsideTimer > 0 || this.isDestroyed || this.isDead) return null

    this.rightBroadsideTimer = DEFAULT_BALANCE_CONFIG.sideWeapon.cooldown
    const rightAngle = this.rotation + Math.PI / 2

    return this.createBroadsideProjectiles(rightAngle)
  }

  private createBroadsideProjectiles(sideAngle: number): Projectile[] {
    const projectiles: Projectile[] = []
    const sideWeapon = DEFAULT_BALANCE_CONFIG.sideWeapon
    const offsets = [-18, 0, 18]

    offsets.forEach((offset) => {
      const forwardX = Math.sin(this.rotation) * offset
      const forwardY = -Math.cos(this.rotation) * offset

      const sideX = Math.sin(sideAngle) * 20
      const sideY = -Math.cos(sideAngle) * 20

      const spawnX = this.x + forwardX + sideX
      const spawnY = this.y + forwardY + sideY

      projectiles.push(
        new Projectile({
          x: spawnX,
          y: spawnY,
          angle: sideAngle,
          speed: sideWeapon.speed,
          damage: sideWeapon.damage,
          lifetime: sideWeapon.lifetime,
          owner: 'player',
          sourceVariant: this.variant,
        }),
      )
    })

    return projectiles
  }
}
