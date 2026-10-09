import { Assets, Texture } from 'pixi.js'

export const ALL_GAME_TILES = [
  73, // Water
  // Sand Island Tiles
  1,
  2,
  3,
  4,
  5,
  17,
  18,
  19,
  20,
  21,
  33,
  34,
  35,
  68,
  69,
  81,
  83,
  85,
  // Grass Island Tiles
  6,
  7,
  8,
  9,
  22,
  23,
  24,
  25,
  36,
  37,
  38,
  39,
  40,
  41,
  52,
  53,
  54,
  55,
  56,
  57,
  82,
  84,
  86,
]

export const ALL_GAME_SHIPS = [
  'ship_1.png',
  'ship_2.png',
  'ship_3.png',
  'ship_4.png',
  'ship_5.png',
  'ship_6.png',
]

export async function preloadGameAssets(): Promise<void> {
  const urls: string[] = []

  // Add tiles
  ALL_GAME_TILES.forEach((id) => {
    urls.push(`/assets/png/default/tiles/tile_${id}.png`)
  })

  // Add retina ships
  ALL_GAME_SHIPS.forEach((shipName) => {
    urls.push(`/assets/png/retina/ships/${shipName}`)
    urls.push(`/assets/png/default/ships/${shipName}`)
  })

  // Add UI / Controls icons if used in PixiJS
  urls.push(
    '/assets/png/default/effects/fire_1.png',
    '/assets/png/default/ui/hud/icon_heart.png',
    '/assets/png/default/ui/hud/icon_score.png',
    '/assets/png/default/ui/hud/icon_time.png',
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
    const tex = Texture.from(path)
    if (tex) return tex
  } catch (_e) {
    // fallback
  }
  return Texture.from(fallbackPath)
}
