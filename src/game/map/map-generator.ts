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

interface ProceduralIsland {
  type: IslandType
  pattern: number[][]
  startC: number
  startR: number
  specialEdgeTile?: number
}

/**
 * Procedurally generates a thick, non-rectangular island shape pattern
 * Enforces a minimum thickness of 2+ tiles everywhere, preventing 1-tile narrow strips or ring holes.
 */
function generateProceduralIslandPattern(type: IslandType): number[][] {
  const isSand = type === 'sand'
  const w = isSand ? 3 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 3) // Sand: 3-5, Grass: 5-7
  const h = isSand ? 3 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 3) // Sand: 3-5, Grass: 4-6

  // Start with a solid block pattern
  const pattern: number[][] = Array.from({ length: h }, () => Array(w).fill(1))

  // Procedurally carve a solid corner step if pattern is large enough (w >= 4 and h >= 4)
  if (w >= 4 && h >= 4 && Math.random() < 0.75) {
    const carveW = 2 + (w >= 6 ? Math.floor(Math.random() * 2) : 0)
    const carveH = 2 + (h >= 5 ? Math.floor(Math.random() * 2) : 0)
    const corner = Math.floor(Math.random() * 4) // 0: TR, 1: BR, 2: BL, 3: TL

    if (corner === 0) {
      for (let r = 0; r < carveH; r++) {
        for (let c = w - carveW; c < w; c++) {
          pattern[r][c] = 0
        }
      }
    } else if (corner === 1) {
      for (let r = h - carveH; r < h; r++) {
        for (let c = w - carveW; c < w; c++) {
          pattern[r][c] = 0
        }
      }
    } else if (corner === 2) {
      for (let r = h - carveH; r < h; r++) {
        for (let c = 0; c < carveW; c++) {
          pattern[r][c] = 0
        }
      }
    } else {
      for (let r = 0; r < carveH; r++) {
        for (let c = 0; c < carveW; c++) {
          pattern[r][c] = 0
        }
      }
    }
  }

  return pattern
}

export function generateMap(width = 4800, height = 3600, tileSize = 128): MapData {
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

  // 1. Layer 1: Water Background Layer (Base ocean water tile_73 scaled 2x to 256px across whole arena)
  const oceanTileSize = tileSize * 2 // 256px
  const oceanCols = Math.ceil(width / oceanTileSize)
  const oceanRows = Math.ceil(height / oceanTileSize)

  for (let r = 0; r < oceanRows; r++) {
    for (let c = 0; c < oceanCols; c++) {
      const waterSprite = new Sprite(waterTexture)
      waterSprite.x = c * oceanTileSize
      waterSprite.y = r * oceanTileSize
      waterSprite.width = oceanTileSize
      waterSprite.height = oceanTileSize
      container.addChild(waterSprite)
    }
  }

  // 2. Procedurally Generate and Place Islands (Enforcing min 4-tile ocean gap constraint)
  const getRandomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  interface CellData {
    type: IslandType
    islandIndex: number
  }
  const grid: (CellData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))

  const islandShapes: ProceduralIsland[] = []
  const specialSandTiles = [81, 83, 85]
  const specialGrassTiles = [82, 84, 86]

  // Quadrant bounds for well-distributed procedural placement across 4800x3600 map
  const placementZones = [
    { minC: 3, maxC: 12, minR: 3, maxR: 11, type: 'sand' as IslandType },
    { minC: 15, maxC: 22, minR: 3, maxR: 10, type: 'sand' as IslandType },
    { minC: 24, maxC: 32, minR: 3, maxR: 12, type: 'grass' as IslandType },
    { minC: 3, maxC: 12, minR: 16, maxR: 22, type: 'sand' as IslandType },
    { minC: 13, maxC: 21, minR: 16, maxR: 22, type: 'grass' as IslandType },
    { minC: 24, maxC: 31, minR: 16, maxR: 22, type: 'grass' as IslandType },
  ]

  placementZones.forEach((zone, islandIdx) => {
    let placed = false
    let attempts = 0

    while (!placed && attempts < 30) {
      attempts++
      const pattern = generateProceduralIslandPattern(zone.type)
      const pRows = pattern.length
      const pCols = pattern[0].length

      const maxStartC = Math.min(zone.maxC, cols - pCols - 2)
      const maxStartR = Math.min(zone.maxR, rows - pRows - 2)
      const minStartC = Math.max(zone.minC, 2)
      const minStartR = Math.max(zone.minR, 2)

      if (maxStartC < minStartC || maxStartR < minStartR) continue

      const startC = minStartC + Math.floor(Math.random() * (maxStartC - minStartC + 1))
      const startR = minStartR + Math.floor(Math.random() * (maxStartR - minStartR + 1))

      // Validate strict 4-tile distance buffer from all previously placed islands
      let validGap = true
      for (let pr = 0; pr < pRows; pr++) {
        for (let pc = 0; pc < pCols; pc++) {
          if (pattern[pr][pc] === 1) {
            const r = startR + pr
            const c = startC + pc

            for (let dr = -4; dr <= 4; dr++) {
              for (let dc = -4; dc <= 4; dc++) {
                const checkR = r + dr
                const checkC = c + dc
                if (checkR >= 0 && checkR < rows && checkC >= 0 && checkC < cols) {
                  const existing = grid[checkR][checkC]
                  if (existing && existing.islandIndex !== islandIdx) {
                    validGap = false
                    break
                  }
                }
              }
              if (!validGap) break
            }
          }
          if (!validGap) break
        }
      }

      if (validGap) {
        placed = true
        const specialEdgeTile = getRandomChoice(
          zone.type === 'sand' ? specialSandTiles : specialGrassTiles,
        )

        islandShapes.push({
          type: zone.type,
          pattern,
          startC,
          startR,
          specialEdgeTile,
        })

        for (let pr = 0; pr < pRows; pr++) {
          for (let pc = 0; pc < pCols; pc++) {
            if (pattern[pr][pc] === 1) {
              const r = startR + pr
              const c = startC + pc
              grid[r][c] = { type: zone.type, islandIndex: islandIdx }
            }
          }
        }
      }
    }
  })

  const isLand = (r: number, c: number): boolean => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false
    return grid[r][c] !== null
  }

  const specialEdgeUsed: boolean[] = new Array(islandShapes.length).fill(false)

  // 3. Layer 2: Submerged Island Base (Rendered under ENTIRE island and border ring)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]

      if (cell) {
        // Under ALL land cells: Render full submerged shallow water base (tile 27)
        const subSprite = new Sprite(getTileTexture(27))
        subSprite.x = c * tileSize
        subSprite.y = r * tileSize
        subSprite.width = tileSize
        subSprite.height = tileSize
        container.addChild(subSprite)
      } else {
        // Coastal water cells: Render submerged border tile ring
        const N = isLand(r - 1, c)
        const S = isLand(r + 1, c)
        const W = isLand(r, c - 1)
        const E = isLand(r, c + 1)

        const NW = isLand(r - 1, c - 1)
        const NE = isLand(r - 1, c + 1)
        const SW = isLand(r + 1, c - 1)
        const SE = isLand(r + 1, c + 1)

        let submergedTileIdx: number | null = null
        const cardinalCount = (N ? 1 : 0) + (S ? 1 : 0) + (W ? 1 : 0) + (E ? 1 : 0)

        // 1. Full Submerged Water / Gulf / Cove
        if (cardinalCount >= 3) {
          submergedTileIdx = 27
        }
        // 2. Submerged Companion for Inner Land Bends
        else if (S && E && SE) {
          submergedTileIdx = 75 // Acompanha canto superior esquerdo de dobra
        } else if (S && W && SW) {
          submergedTileIdx = 74 // Acompanha canto superior direito de dobra
        } else if (N && E && NE) {
          submergedTileIdx = 59 // Acompanha canto inferior esquerdo de dobra
        } else if (N && W && NW) {
          submergedTileIdx = 58 // Acompanha canto inferior direito de dobra
        }
        // 3. Submerged Outer Corners
        else if ((S && E) || (!N && !S && !W && !E && SE)) {
          submergedTileIdx = 10 // Canto superior esquerdo submerso
        } else if ((S && W) || (!N && !S && !W && !E && SW)) {
          submergedTileIdx = 12 // Canto superior direito submerso
        } else if ((N && E) || (!N && !S && !W && !E && NE)) {
          submergedTileIdx = 42 // Canto inferior esquerdo submerso
        } else if ((N && W) || (!N && !S && !W && !E && NW)) {
          submergedTileIdx = 44 // Canto inferior direito submerso
        }
        // 4. Straight Submerged Edges
        else if (S) {
          submergedTileIdx = 11 // Borda superior submersa
        } else if (N) {
          submergedTileIdx = 43 // Borda inferior submersa
        } else if (E) {
          submergedTileIdx = 26 // Borda esquerda submersa
        } else if (W) {
          submergedTileIdx = 28 // Borda direita submersa
        }

        if (submergedTileIdx !== null) {
          const subSprite = new Sprite(getTileTexture(submergedTileIdx))
          subSprite.x = c * tileSize
          subSprite.y = r * tileSize
          subSprite.width = tileSize
          subSprite.height = tileSize
          container.addChild(subSprite)
        }
      }
    }
  }

  // 4. Layer 3: Solid Land Tiles (Sand & Grass tiles)
  interface TileRenderInfo {
    r: number
    c: number
    tileIdx: number
    rotation: number
  }
  const landRenderList: TileRenderInfo[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]
      if (!cell) continue

      const type = cell.type
      const islandIdx = cell.islandIndex
      const specialTile = islandShapes[islandIdx]?.specialEdgeTile

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
        if (!N && !W) {
          tileIdx = 1 // Top-left outer corner
        } else if (!N && !E) {
          tileIdx = 3 // Top-right outer corner
        } else if (!S && !W) {
          tileIdx = 33 // Bottom-left outer corner
        } else if (!S && !E) {
          tileIdx = 35 // Bottom-right outer corner
        }
        // Inner Concave Corners (Dobras de Canto)
        else if (S && E && !SE) {
          tileIdx = 4 // Canto inferior direito de dobra de areia
        } else if (S && W && !SW) {
          tileIdx = 5 // Canto inferior esquerdo de dobra de areia
        } else if (N && E && !NE) {
          tileIdx = 20 // Canto superior direito de dobra de areia
        } else if (N && W && !NW) {
          tileIdx = 21 // Canto superior esquerdo de dobra de areia
        }
        // Straight Outer Edges
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
        // Inner Sand Fill
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
        if (!N && !W) {
          tileIdx = 6 // Top-left outer corner grass
        } else if (!N && !E) {
          tileIdx = 9 // Top-right outer corner grass
        } else if (!S && !W) {
          tileIdx = 54 // Bottom-left outer corner grass
        } else if (!S && !E) {
          tileIdx = 57 // Bottom-right outer corner grass
        }
        // Inner Concave Corners (Dobras de Canto)
        else if (S && E && !SE) {
          tileIdx = 36 // Canto inferior direito de dobra da ilha com grama
        } else if (S && W && !SW) {
          tileIdx = 37 // Canto inferior esquerdo de dobra da ilha com grama
        } else if (N && E && !NE) {
          tileIdx = 52 // Canto superior direito de dobra da ilha com grama
        } else if (N && W && !NW) {
          tileIdx = 53 // Canto superior esquerdo de dobra da ilha com grama
        }
        // Straight Outer Edges
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
        // Inner Grass Fill
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

      landRenderList.push({ r, c, tileIdx, rotation })

      // Register obstacle circle for solid land physics & ship collisions
      obstacles.push({
        x: c * tileSize + tileSize / 2,
        y: r * tileSize + tileSize / 2,
        radius: tileSize * 0.48,
      })
    }
  }

  // Render all land sprites on top of submerged base layer
  landRenderList.forEach((item) => {
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

  // Safe Dynamic Player Spawn (Center open water)
  const playerSpawn = {
    x: width * 0.5,
    y: height * 0.5,
  }

  // Safe Dynamic Enemy Spawns (Open water corners & edges)
  const enemySpawns = [
    { x: 400, y: 400 },
    { x: width - 400, y: 400 },
    { x: 400, y: height - 400 },
    { x: width - 400, y: height - 400 },
    { x: width * 0.5, y: 300 },
    { x: width * 0.5, y: height - 300 },
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
