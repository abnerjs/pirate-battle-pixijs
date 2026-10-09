import { Assets, Texture } from 'pixi.js'

export const ALL_GAME_TILES = Array.from({ length: 96 }, (_, i) => i + 1)
export const ALL_GAME_SHIPS = Array.from({ length: 24 }, (_, i) => `ship_${i + 1}.png`)

export async function preloadGameAssets(): Promise<void> {
  const urls: string[] = []

  // Add all 96 tiles
  ALL_GAME_TILES.forEach((id) => {
    urls.push(`/assets/png/default/tiles/tile_${id}.png`)
  })

  // Add retina and default ships
  ALL_GAME_SHIPS.forEach((shipName) => {
    urls.push(`/assets/png/retina/ships/${shipName}`)
    urls.push(`/assets/png/default/ships/${shipName}`)
  })

  // Add ship parts & projectiles
  urls.push(
    '/assets/png/default/ship_parts/cannon_ball.png',
    '/assets/png/default/ship_parts/cannon.png',
  )

  for (let i = 1; i <= 4; i++) {
    urls.push(`/assets/png/retina/ship_parts/wood_${i}.png`)
    urls.push(`/assets/png/default/ship_parts/wood_${i}.png`)
  }

  for (let i = 1; i <= 6; i++) {
    urls.push(`/assets/png/retina/ship_parts/crew_${i}.png`)
    urls.push(`/assets/png/default/ship_parts/crew_${i}.png`)
  }

  // Add explosion & particle effects
  urls.push(
    '/assets/png/default/effects/explosion_1.png',
    '/assets/png/default/effects/explosion_2.png',
    '/assets/png/default/effects/explosion_3.png',
    '/assets/png/default/effects/fire_1.png',
    '/assets/png/default/effects/fire_2.png',
  )

  // Add UI & HUD icons
  urls.push(
    '/assets/png/default/ui/hud/icon_heart.png',
    '/assets/png/default/ui/hud/icon_score.png',
    '/assets/png/default/ui/hud/icon_time.png',
    '/assets/png/default/ui/hud/health_frame.png',
    '/assets/png/default/ui/hud/health_fill_green.png',
    '/assets/png/retina/ui/hud/enemy_health_frame.png',
    '/assets/png/default/ui/hud/enemy_health_frame.png',
    '/assets/png/retina/ui/hud/enemy_health_fill_red.png',
    '/assets/png/default/ui/hud/enemy_health_fill_red.png',
    '/assets/png/retina/ui/hud/enemy_health_fill_green.png',
    '/assets/png/default/ui/hud/enemy_health_fill_green.png',
    '/assets/png/default/ui/controls/button_round_normal.png',
    '/assets/png/default/ui/controls/button_round_pressed.png',
  )

  try {
    await Assets.load(urls)
  } catch (err) {
    console.warn('Failed to load some game assets via Assets.load:', err)
  }
}

export function getLoadedTexture(
  path: string,
  fallbackPath = '/assets/png/default/tiles/tile_73.png',
): Texture {
  try {
    if (Assets.cache.has(path)) {
      return Assets.get(path)
    }
    const tex = Texture.from(path)
    if (tex) return tex
  } catch (_e) {
    // fallback
  }
  if (Assets.cache.has(fallbackPath)) {
    return Assets.get(fallbackPath)
  }
  return Texture.from(fallbackPath)
}
