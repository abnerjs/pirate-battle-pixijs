import { Container, Sprite, Texture } from 'pixi.js'
import { getLoadedTexture } from '../asset-loader'

interface EffectInstance {
  sprite: Sprite
  duration: number
  elapsed: number
  startScale: number
  targetScale: number
  isExplosion?: boolean
}

interface FloatingDebris {
  sprite: Sprite
  type: 'wood' | 'crew'
  duration: number
  elapsed: number
  vx: number
  vy: number
  rotationSpeed?: number
  baseScale: number
}

export class EffectsManager {
  private container: Container
  private activeEffects: EffectInstance[] = []
  private activeDebris: FloatingDebris[] = []

  constructor(container: Container) {
    this.container = container
  }

  public spawnExplosion(x: number, y: number, scale = 1.0) {
    const explosionNum = Math.random() < 0.5 ? 1 : 2
    const texture: Texture = getLoadedTexture(
      `/assets/png/default/effects/explosion_${explosionNum}.png`,
    )

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x
    sprite.y = y

    const startScale = scale * 0.1
    const targetScale = scale * 0.85

    sprite.scale.set(startScale)
    sprite.rotation = Math.random() * Math.PI * 2

    this.container.addChild(sprite)
    this.activeEffects.push({
      sprite,
      duration: 0.4,
      elapsed: 0,
      startScale,
      targetScale,
      isExplosion: true,
    })

    // Cap active explosion effects to 30 max to ensure 60fps performance
    if (this.activeEffects.length > 30) {
      const oldest = this.activeEffects.shift()
      if (oldest) {
        this.container.removeChild(oldest.sprite)
        oldest.sprite.destroy()
      }
    }
  }

  public spawnWaterSplash(x: number, y: number) {
    const texture: Texture = getLoadedTexture('/assets/png/default/effects/explosion_3.png')

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x
    sprite.y = y
    sprite.scale.set(0.15)
    sprite.tint = 0x38bdf8

    this.container.addChild(sprite)
    this.activeEffects.push({
      sprite,
      duration: 0.3,
      elapsed: 0,
      startScale: 0.15,
      targetScale: 0.6,
      isExplosion: false,
    })
  }

  public spawnWoodDebris(x: number, y: number) {
    const num = Math.floor(Math.random() * 4) + 1
    const texPath = `/assets/png/retina/ship_parts/wood_${num}.png`
    const fallbackPath = `/assets/png/default/ship_parts/wood_${num}.png`
    const texture = getLoadedTexture(texPath, fallbackPath)

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x + (Math.random() - 0.5) * 20
    sprite.y = y + (Math.random() - 0.5) * 20
    sprite.rotation = Math.random() * Math.PI * 2

    const baseScale = 0.5 + Math.random() * 0.2
    sprite.scale.set(baseScale)

    const angle = Math.random() * Math.PI * 2
    const driftSpeed = 8 + Math.random() * 12

    this.container.addChild(sprite)
    this.activeDebris.push({
      sprite,
      type: 'wood',
      duration: 1.0,
      elapsed: 0,
      vx: Math.cos(angle) * driftSpeed,
      vy: Math.sin(angle) * driftSpeed,
      rotationSpeed: (Math.random() - 0.5) * 2,
      baseScale,
    })
  }

  public spawnCrewDebris(x: number, y: number) {
    const num = Math.floor(Math.random() * 6) + 1
    const texPath = `/assets/png/retina/ship_parts/crew_${num}.png`
    const fallbackPath = `/assets/png/default/ship_parts/crew_${num}.png`
    const texture = getLoadedTexture(texPath, fallbackPath)

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x + (Math.random() - 0.5) * 16
    sprite.y = y + (Math.random() - 0.5) * 16

    const swimAngle = Math.random() * Math.PI * 2
    sprite.rotation = swimAngle + Math.PI / 2

    const baseScale = 0.45 + Math.random() * 0.15
    sprite.scale.set(baseScale)

    const swimSpeed = 35 + Math.random() * 20

    this.container.addChild(sprite)
    this.activeDebris.push({
      sprite,
      type: 'crew',
      duration: 4.0,
      elapsed: 0,
      vx: Math.cos(swimAngle) * swimSpeed,
      vy: Math.sin(swimAngle) * swimSpeed,
      baseScale,
    })

    // Cap active floating debris to 50 max to maintain optimal rendering performance
    if (this.activeDebris.length > 50) {
      const oldest = this.activeDebris.shift()
      if (oldest) {
        this.container.removeChild(oldest.sprite)
        oldest.sprite.destroy()
      }
    }
  }

  public spawnAttackDebris(x: number, y: number) {
    if (Math.random() < 0.5) {
      const count = Math.floor(Math.random() * 2) + 1
      for (let i = 0; i < count; i++) {
        this.spawnWoodDebris(x, y)
      }
    } else {
      this.spawnCrewDebris(x, y)
    }
  }

  public update(deltaSeconds: number) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]
      effect.elapsed += deltaSeconds

      const progress = Math.min(1, effect.elapsed / effect.duration)

      if (effect.isExplosion) {
        const zoomPhase = 0.3
        if (progress <= zoomPhase) {
          const p = progress / zoomPhase
          const easeZoom = 1 - (1 - p) ** 3
          const currentScale =
            effect.startScale + (effect.targetScale - effect.startScale) * easeZoom
          effect.sprite.scale.set(currentScale)
          effect.sprite.alpha = 1.0
        } else {
          const p = (progress - zoomPhase) / (1 - zoomPhase)
          effect.sprite.scale.set(effect.targetScale)
          effect.sprite.alpha = 1 - p
        }
      } else {
        const currentScale = effect.startScale + (effect.targetScale - effect.startScale) * progress
        effect.sprite.scale.set(currentScale)
        effect.sprite.alpha = 1 - progress
      }

      if (progress >= 1) {
        this.container.removeChild(effect.sprite)
        effect.sprite.destroy()
        this.activeEffects.splice(i, 1)
      }
    }

    for (let i = this.activeDebris.length - 1; i >= 0; i--) {
      const d = this.activeDebris[i]
      d.elapsed += deltaSeconds

      d.sprite.x += d.vx * deltaSeconds
      d.sprite.y += d.vy * deltaSeconds

      if (d.rotationSpeed) {
        d.sprite.rotation += d.rotationSpeed * deltaSeconds
      }

      if (d.type === 'wood') {
        const bob = Math.sin(d.elapsed * 8) * 0.05
        d.sprite.scale.set(d.baseScale + bob)

        if (d.elapsed > 0.7) {
          d.sprite.alpha = Math.max(0, (1.0 - d.elapsed) / 0.3)
        }
      } else if (d.type === 'crew') {
        const swimStroke = Math.sin(d.elapsed * 10) * 0.08
        d.sprite.scale.set(d.baseScale + swimStroke)

        if (d.elapsed > 3.5) {
          d.sprite.alpha = Math.max(0, (4.0 - d.elapsed) / 0.5)
        }
      }

      if (d.elapsed >= d.duration) {
        this.container.removeChild(d.sprite)
        d.sprite.destroy()
        this.activeDebris.splice(i, 1)
      }
    }
  }

  public purgeFarEffects(px: number, py: number, maxDist: number): number {
    let pruned = 0

    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const ef = this.activeEffects[i]
      if (Math.hypot(ef.sprite.x - px, ef.sprite.y - py) > maxDist) {
        this.container.removeChild(ef.sprite)
        ef.sprite.destroy()
        this.activeEffects.splice(i, 1)
        pruned++
      }
    }

    for (let i = this.activeDebris.length - 1; i >= 0; i--) {
      const d = this.activeDebris[i]
      if (Math.hypot(d.sprite.x - px, d.sprite.y - py) > maxDist) {
        this.container.removeChild(d.sprite)
        d.sprite.destroy()
        this.activeDebris.splice(i, 1)
        pruned++
      }
    }

    return pruned
  }

  public clear() {
    this.activeEffects.forEach((ef) => {
      this.container.removeChild(ef.sprite)
      ef.sprite.destroy()
    })
    this.activeEffects = []

    this.activeDebris.forEach((d) => {
      this.container.removeChild(d.sprite)
      d.sprite.destroy()
    })
    this.activeDebris = []
  }
}
