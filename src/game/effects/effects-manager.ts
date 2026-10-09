import { Container, Sprite, Texture } from 'pixi.js'

interface EffectInstance {
  sprite: Sprite
  duration: number
  elapsed: number
  startScale: number
  endScale: number
}

export class EffectsManager {
  private container: Container
  private activeEffects: EffectInstance[] = []

  constructor(container: Container) {
    this.container = container
  }

  public spawnExplosion(x: number, y: number, scale = 1.0) {
    let texture: Texture
    try {
      texture = Texture.from('/assets/png/default/effects/explosion_1.png')
    } catch (_e) {
      texture = Texture.WHITE
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x
    sprite.y = y
    sprite.scale.set(scale * 0.3)

    this.container.addChild(sprite)
    this.activeEffects.push({
      sprite,
      duration: 0.4,
      elapsed: 0,
      startScale: scale * 0.3,
      endScale: scale * 1.2,
    })
  }

  public spawnWaterSplash(x: number, y: number) {
    let texture: Texture
    try {
      texture = Texture.from('/assets/png/default/effects/explosion_3.png')
    } catch (_e) {
      texture = Texture.WHITE
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x
    sprite.y = y
    sprite.scale.set(0.2)
    sprite.tint = 0x38bdf8

    this.container.addChild(sprite)
    this.activeEffects.push({
      sprite,
      duration: 0.3,
      elapsed: 0,
      startScale: 0.2,
      endScale: 0.7,
    })
  }

  public update(deltaSeconds: number) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]
      effect.elapsed += deltaSeconds

      const progress = Math.min(1, effect.elapsed / effect.duration)
      const currentScale = effect.startScale + (effect.endScale - effect.startScale) * progress
      effect.sprite.scale.set(currentScale)
      effect.sprite.alpha = 1 - progress

      if (progress >= 1) {
        this.container.removeChild(effect.sprite)
        effect.sprite.destroy()
        this.activeEffects.splice(i, 1)
      }
    }
  }

  public clear() {
    this.activeEffects.forEach((ef) => {
      this.container.removeChild(ef.sprite)
      ef.sprite.destroy()
    })
    this.activeEffects = []
  }
}
