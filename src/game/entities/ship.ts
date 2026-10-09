import { Container, Graphics, Sprite, Texture } from 'pixi.js'

export interface ShipOptions {
  x: number
  y: number
  rotation?: number
  maxHp: number
  shipTexturePath: string
  isPlayer?: boolean
}

export class Ship {
  public container: Container
  public sprite: Sprite
  public healthBarContainer: Container
  public healthFillGraphics: Graphics
  public fireSprite: Sprite | null = null

  public x: number
  public y: number
  public rotation: number // Angle in radians (0 = Up)
  public hp: number
  public maxHp: number
  public radius = 28
  public isPlayer: boolean
  public isDestroyed = false

  constructor(options: ShipOptions) {
    this.x = options.x
    this.y = options.y
    this.rotation = options.rotation || 0
    this.maxHp = options.maxHp
    this.hp = options.maxHp
    this.isPlayer = !!options.isPlayer

    this.container = new Container()
    this.container.x = this.x
    this.container.y = this.y

    let texture: Texture
    try {
      texture = Texture.from(options.shipTexturePath)
    } catch (_e) {
      texture = Texture.from('/assets/png/default/ships/ship_1.png')
    }

    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5, 0.5)
    this.sprite.rotation = this.rotation + Math.PI
    this.container.addChild(this.sprite)

    // Health Bar Container (Only for enemy ships, player health is in HUD)
    this.healthBarContainer = new Container()
    this.healthBarContainer.y = -45

    const bgGraphics = new Graphics()
    bgGraphics.rect(-24, -4, 48, 8)
    bgGraphics.fill({ color: 0x000000, alpha: 0.75 })
    bgGraphics.stroke({ color: 0x334155, width: 1 })
    this.healthBarContainer.addChild(bgGraphics)

    this.healthFillGraphics = new Graphics()
    this.healthBarContainer.addChild(this.healthFillGraphics)

    if (!this.isPlayer) {
      this.container.addChild(this.healthBarContainer)
      this.updateHealthBar()
    }
  }

  public updateHealthBar() {
    this.healthFillGraphics.clear()

    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp))
    if (hpRatio <= 0) return

    const fillWidth = Math.floor(46 * hpRatio)
    let fillColor = 0x10b981
    if (hpRatio <= 0.25) {
      fillColor = 0xef4444
    } else if (hpRatio <= 0.5) {
      fillColor = 0xf59e0b
    }

    this.healthFillGraphics.rect(-23, -3, fillWidth, 6)
    this.healthFillGraphics.fill({ color: fillColor })

    if (hpRatio < 0.5 && !this.fireSprite) {
      try {
        const fireTex = Texture.from('/assets/png/default/effects/fire_1.png')
        this.fireSprite = new Sprite(fireTex)
        this.fireSprite.anchor.set(0.5, 0.5)
        this.fireSprite.scale.set(0.6)
        this.fireSprite.y = 10
        this.container.addChild(this.fireSprite)
      } catch (_e) {
        // Optional fire sprite
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isDestroyed) return false

    this.hp = Math.max(0, this.hp - amount)
    this.updateHealthBar()

    if (this.hp <= 0) {
      this.isDestroyed = true
      return true
    }
    return false
  }

  public setPosition(x: number, y: number) {
    this.x = x
    this.y = y
    this.container.x = x
    this.container.y = y
  }

  public setRotation(angle: number) {
    this.rotation = angle
    this.sprite.rotation = angle + Math.PI
  }

  public destroy(parentContainer: Container) {
    this.isDestroyed = true
    parentContainer.removeChild(this.container)
    this.container.destroy({ children: true })
  }
}
