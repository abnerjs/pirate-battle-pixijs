import { Container, Sprite, Texture } from 'pixi.js'

export interface IslandObstacle {
  x: number
  y: number
  radius: number
}

export interface MapData {
  container: Container
  obstacles: IslandObstacle[]
  playerSpawn: { x: number; y: number }
  enemySpawns: { x: number; y: number }[]
  width: number
  height: number
}

type IslandType = 'sand' | 'grass'

interface IslandShape {
  type: IslandType
  // Matrix pattern relative to startC, startR where 1 = land, 0 = water
  pattern: number[][]
  startC: number
  startR: number
  specialEdgeTile?: number
}

export function generateMap(width = 2400, height = 1800, tileSize = 64): MapData {
  const container = new Container()
  container.label = 'MapContainer'

  const cols = Math.ceil(width / tileSize)
  const rows = Math.ceil(height / tileSize)

  const getTileTexture = (tileIndex: number): Texture => {
    try {
      return Texture.from(`/assets/png/default/tiles/tile_${tileIndex}.png`)
    } catch (_e) {
      return Texture.from('/assets/png/default/tiles/tile_73.png')
    }
  }

  const waterTexture = getTileTexture(73)
  const obstacles: IslandObstacle[] = []

  // 1. Water Background Layer
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const waterSprite = new Sprite(waterTexture)
      waterSprite.x = c * tileSize
      waterSprite.y = r * tileSize
      waterSprite.width = tileSize
      waterSprite.height = tileSize
      container.addChild(waterSprite)
    }
  }

  // 2. Define Custom Non-Rectangular Islands (L-shaped, U-shaped, irregular polygons)
  const islandShapes: IslandShape[] = [
    // Island 1: L-Shaped Sand Island (West) - Smaller than grass islands
    {
      type: 'sand',
      startC: 4,
      startR: 5,
      specialEdgeTile: 81,
      pattern: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 0, 0],
        [1, 1, 0, 0],
      ],
    },
    // Island 2: L-Shaped Grass Island (North-East) - Larger island
    {
      type: 'grass',
      startC: 22,
      startR: 3,
      specialEdgeTile: 84,
      pattern: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0],
      ],
    },
    // Island 3: U-Shaped Lagoon Grass Island (South-East)
    {
      type: 'grass',
      startC: 19,
      startR: 16,
      specialEdgeTile: 82,
      pattern: [
        [1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 1, 1],
        [1, 1, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1],
      ],
    },
    // Island 4: Small Irregular Sand Island (South-West)
    {
      type: 'sand',
      startC: 5,
      startR: 19,
      specialEdgeTile: 83,
      pattern: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 0],
      ],
    },
    // Island 5: Irregular Sand Island (Center North)
    {
      type: 'sand',
      startC: 15,
      startR: 4,
      specialEdgeTile: 85,
      pattern: [
        [0, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 0],
      ],
    },
    // Island 6: T-Shaped Grass Island (Center South)
    {
      type: 'grass',
      startC: 11,
      startR: 18,
      specialEdgeTile: 86,
      pattern: [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
      ],
    },
  ]

  // Map tracking grid contents: null = water, { type, islandIndex } = land
  interface CellData {
    type: IslandType
    islandIndex: number
  }
  const grid: (CellData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
  const specialEdgeUsed: boolean[] = new Array(islandShapes.length).fill(false)

  // Populate grid with island shapes
  islandShapes.forEach((shape, idx) => {
    const pRows = shape.pattern.length
    const pCols = shape.pattern[0].length

    for (let pr = 0; pr < pRows; pr++) {
      for (let pc = 0; pc < pCols; pc++) {
        if (shape.pattern[pr][pc] === 1) {
          const r = shape.startR + pr
          const c = shape.startC + pc
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            grid[r][c] = { type: shape.type, islandIndex: idx }
          }
        }
      }
    }
  })

  const isLand = (r: number, c: number): boolean => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false
    return grid[r][c] !== null
  }

  const getRandomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  // 3. Autotiling Logic with Inner Bends (Dobras de Canto 4, 5, 20, 21 for sand; 36, 37, 52, 53 for grass)
  interface TileRenderInfo {
    r: number
    c: number
    tileIdx: number
    rotation: number
  }
  const renderList: TileRenderInfo[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]
      if (!cell) continue

      const type = cell.type
      const islandIdx = cell.islandIndex
      const specialTile = islandShapes[islandIdx].specialEdgeTile

      // 8-neighbor adjacency check
      const N = isLand(r - 1, c)
      const S = isLand(r + 1, c)
      const W = isLand(r, c - 1)
      const E = isLand(r, c + 1)

      const NW = isLand(r - 1, c - 1)
      const NE = isLand(r - 1, c + 1)
      const SW = isLand(r + 1, c - 1)
      const SE = isLand(r + 1, c + 1)

      let tileIdx = 2
      let rotation = 0

      if (type === 'sand') {
        // --- SAND ISLAND AUTOTILING ---
        // A. Outer Convex Corners
        if (!N && !W) {
          tileIdx = 1 // Top-left corner
        } else if (!N && !E) {
          tileIdx = 3 // Top-right corner
        } else if (!S && !W) {
          tileIdx = 33 // Bottom-left corner
        } else if (!S && !E) {
          tileIdx = 35 // Bottom-right corner
        }
        // B. Inner Concave Corners (Dobras de Canto)
        else if (S && E && !SE) {
          tileIdx = 4 // Canto inferior direito de dobra de areia
        } else if (S && W && !SW) {
          tileIdx = 5 // Canto inferior esquerdo de dobra de areia
        } else if (N && E && !NE) {
          tileIdx = 20 // Canto superior direito de dobra de areia
        } else if (N && W && !NW) {
          tileIdx = 21 // Canto superior esquerdo de dobra de areia
        }
        // C. Straight Outer Edges
        else if (!N) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = Math.PI // 180° for top edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = 2 // Top edge
          }
        } else if (!S) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = 0 // 0° for bottom edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = 34 // Bottom edge
          }
        } else if (!W) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = Math.PI / 2 // 90° for left edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = 17 // Left edge
          }
        } else if (!E) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = (3 * Math.PI) / 2 // 270° for right edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = 19 // Right edge
          }
        }
        // D. Inner Sand Fill
        else {
          const rand = Math.random()
          if (rand < 0.2) {
            tileIdx = getRandomChoice([68, 69]) // Sand with pebbles
          } else {
            tileIdx = getRandomChoice([18, 18, 18, 4, 5]) // Pure sand fill
          }
        }
      } else {
        // --- GRASS ISLAND AUTOTILING ---
        // A. Outer Convex Corners
        if (!N && !W) {
          tileIdx = 6 // Top-left corner grass
        } else if (!N && !E) {
          tileIdx = 9 // Top-right corner grass
        } else if (!S && !W) {
          tileIdx = 54 // Bottom-left corner grass
        } else if (!S && !E) {
          tileIdx = 57 // Bottom-right corner grass
        }
        // B. Inner Concave Corners (Dobras de Canto)
        else if (S && E && !SE) {
          tileIdx = 36 // Canto inferior direito de dobra da ilha com grama
        } else if (S && W && !SW) {
          tileIdx = 37 // Canto inferior esquerdo de dobra da ilha com grama
        } else if (N && E && !NE) {
          tileIdx = 52 // Canto superior direito de dobra da ilha com grama
        } else if (N && W && !NW) {
          tileIdx = 53 // Canto superior esquerdo de dobra da ilha com grama
        }
        // C. Straight Outer Edges
        else if (!N) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = Math.PI // 180° for top edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = getRandomChoice([7, 8]) // Top edge grass
          }
        } else if (!S) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = 0 // 0° for bottom edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = getRandomChoice([55, 56]) // Bottom edge grass
          }
        } else if (!W) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = Math.PI / 2 // 90° for left edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = 22 // Left edge grass
          }
        } else if (!E) {
          if (specialTile && !specialEdgeUsed[islandIdx] && Math.random() < 0.35) {
            tileIdx = specialTile
            rotation = (3 * Math.PI) / 2 // 270° for right edge
            specialEdgeUsed[islandIdx] = true
          } else {
            tileIdx = getRandomChoice([25, 41]) // Right edge grass
          }
        }
        // D. Inner Grass Fill
        else {
          const rand = Math.random()
          if (rand < 0.25) {
            tileIdx = 24 // Grass with flowers
          } else if (rand < 0.5) {
            tileIdx = getRandomChoice([39, 40]) // Grass with medium bushes
          } else {
            tileIdx = 23 // Standard grass center
          }
        }
      }

      renderList.push({ r, c, tileIdx, rotation })

      // Register obstacle circle for physics & ship collisions
      obstacles.push({
        x: c * tileSize + tileSize / 2,
        y: r * tileSize + tileSize / 2,
        radius: tileSize * 0.48,
      })
    }
  }

  // 4. Render Sprites from renderList
  renderList.forEach((item) => {
    const posX = item.c * tileSize
    const posY = item.r * tileSize

    const sprite = new Sprite(getTileTexture(item.tileIdx))

    if (item.rotation !== 0) {
      sprite.anchor.set(0.5, 0.5)
      sprite.x = posX + tileSize / 2
      sprite.y = posY + tileSize / 2
      sprite.rotation = item.rotation
    } else {
      sprite.x = posX
      sprite.y = posY
    }

    sprite.width = tileSize
    sprite.height = tileSize
    container.addChild(sprite)
  })

  // Safe Player Spawn (Center open water)
  const playerSpawn = {
    x: width * 0.5,
    y: height * 0.5,
  }

  // Safe Enemy Spawns (Open water corners & edges)
  const enemySpawns = [
    { x: 300, y: 300 },
    { x: width - 300, y: 300 },
    { x: 300, y: height - 300 },
    { x: width - 300, y: height - 300 },
    { x: width * 0.5, y: 200 },
    { x: width * 0.5, y: height - 200 },
  ]

  return {
    container,
    obstacles,
    playerSpawn,
    enemySpawns,
    width,
    height,
  }
}
