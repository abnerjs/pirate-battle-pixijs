import { Container, Sprite, Texture } from 'pixi.js'

export interface IslandObstacle {
  x: number
  y: number
  radius: number
}

export type IslandType = 'sand' | 'grass'

export interface CellData {
  type: IslandType
  islandId: string
  overlayTileIdx?: number
}

export interface WallCannon {
  id: string
  x: number
  y: number
  angle: number
  fireTimer: number
  cooldown: number
}

export interface Chunk {
  key: string
  cx: number
  cy: number
  container: Container
  obstacles: IslandObstacle[]
  wallCannons: WallCannon[]
}

/**
 * Deterministic 32-bit PRNG seed generator based on chunk coordinates and offset
 */
export function seedRandom(cx: number, cy: number, offset = 0): () => number {
  let h = (cx * 73856093) ^ (cy * 19349663) ^ (offset * 83492791)
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1)
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61)
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296
  }
}

export class ChunkManager {
  public tileSize: number
  public oceanTileSize: number
  public chunkTiles: number
  public chunkWidthPx: number
  public renderRadius: number

  public worldContainer: Container
  public landGrid: Map<string, CellData> = new Map()
  public loadedChunks: Map<string, Chunk> = new Map()
  public pregeneratedChunks: Set<string> = new Set()

  private lastCenterCx: number | null = null
  private lastCenterCy: number | null = null
  private cachedObstacles: IslandObstacle[] = []
  private cachedActiveKeys: string[] = []

  constructor(worldContainer: Container, tileSize = 128, chunkTiles = 16, renderRadius = 2) {
    this.worldContainer = worldContainer
    this.tileSize = tileSize
    this.oceanTileSize = tileSize * 2 // 256px ocean water background tiles
    this.chunkTiles = chunkTiles
    this.chunkWidthPx = chunkTiles * tileSize
    this.renderRadius = renderRadius
  }

  private getTileTexture(tileIndex: number): Texture {
    try {
      return Texture.from(`/assets/png/default/tiles/tile_${tileIndex}.png`)
    } catch (_e) {
      return Texture.from('/assets/png/default/tiles/tile_73.png')
    }
  }

  public isLand(gx: number, gy: number): boolean {
    return this.landGrid.has(`${gx}_${gy}`)
  }

  /**
   * Generates a thick procedural island pattern enforcing a minimum 2+ tile thickness.
   */
  public generateProceduralPattern(type: IslandType, rng: () => number): number[][] {
    const isSand = type === 'sand'
    const w = isSand ? 3 + Math.floor(rng() * 3) : 5 + Math.floor(rng() * 3) // Sand: 3-5, Grass: 5-7
    const h = isSand ? 3 + Math.floor(rng() * 3) : 4 + Math.floor(rng() * 3) // Sand: 3-5, Grass: 4-6

    const pattern: number[][] = Array.from({ length: h }, () => Array(w).fill(1))

    if (w >= 4 && h >= 4 && rng() < 0.75) {
      const carveW = 2 + (w >= 6 ? Math.floor(rng() * 2) : 0)
      const carveH = 2 + (h >= 5 ? Math.floor(rng() * 2) : 0)
      const corner = Math.floor(rng() * 4)

      if (corner === 0) {
        for (let r = 0; r < carveH; r++) {
          for (let c = w - carveW; c < w; c++) pattern[r][c] = 0
        }
      } else if (corner === 1) {
        for (let r = h - carveH; r < h; r++) {
          for (let c = w - carveW; c < w; c++) pattern[r][c] = 0
        }
      } else if (corner === 2) {
        for (let r = h - carveH; r < h; r++) {
          for (let c = 0; c < carveW; c++) pattern[r][c] = 0
        }
      } else {
        for (let r = 0; r < carveH; r++) {
          for (let c = 0; c < carveW; c++) pattern[r][c] = 0
        }
      }
    }

    return pattern
  }

  /**
   * Generates connected overlay structures (Fortress perimeter, walls, towers, cannons, rocks, plants)
   * on top of solid island land tiles without replacing the land base.
   */
  private generateIslandOverlays(islandCells: { gx: number; gy: number }[], rng: () => number) {
    if (islandCells.length === 0) return

    let minGx = Infinity
    let maxGx = -Infinity
    let minGy = Infinity
    let maxGy = -Infinity

    for (const cell of islandCells) {
      if (cell.gx < minGx) minGx = cell.gx
      if (cell.gx > maxGx) maxGx = cell.gx
      if (cell.gy < minGy) minGy = cell.gy
      if (cell.gy > maxGy) maxGy = cell.gy
    }

    const iw = maxGx - minGx + 1
    const ih = maxGy - minGy + 1

    const occupied = new Set<string>()
    const getRandomChoice = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

    const firstCell = this.landGrid.get(`${islandCells[0].gx}_${islandCells[0].gy}`)
    const isSand = firstCell?.type === 'sand'
    const fortressChance = rng()

    // 1. Fortified Perimeter (for larger islands iw >= 3 and ih >= 3)
    if (iw >= 3 && ih >= 3 && fortressChance < 0.7) {
      const tlKey = `${minGx}_${minGy}`
      if (this.landGrid.has(tlKey)) {
        this.landGrid.get(tlKey)!.overlayTileIdx = 77 // canto superior esquerdo de muralha com torre
        occupied.add(tlKey)
      }
      const trKey = `${maxGx}_${minGy}`
      if (this.landGrid.has(trKey)) {
        this.landGrid.get(trKey)!.overlayTileIdx = 78 // canto superior direito de muralha com torre
        occupied.add(trKey)
      }
      const blKey = `${minGx}_${maxGy}`
      if (this.landGrid.has(blKey)) {
        this.landGrid.get(blKey)!.overlayTileIdx = 93 // canto inferior esquerdo de muralha com torre
        occupied.add(blKey)
      }
      const brKey = `${maxGx}_${maxGy}`
      if (this.landGrid.has(brKey)) {
        this.landGrid.get(brKey)!.overlayTileIdx = 94 // canto inferior direito de muralha com torre
        occupied.add(brKey)
      }

      // Top edge middle cells
      for (let gx = minGx + 1; gx < maxGx; gx++) {
        const key = `${gx}_${minGy}`
        if (this.landGrid.has(key) && !occupied.has(key)) {
          const choice = rng()
          if (choice < 0.35)
            this.landGrid.get(key)!.overlayTileIdx = 47 // muralha na horizontal com canhao apontando para cima
          else if (choice < 0.55)
            this.landGrid.get(key)!.overlayTileIdx = 76 // muralha na horizontal com portao
          else if (choice < 0.75)
            this.landGrid.get(key)!.overlayTileIdx = 96 // muralha na horizontal com espaço para pessoas
          else if (choice < 0.88)
            this.landGrid.get(key)!.overlayTileIdx = 30 // torre de ligacao de muralhas na horizontal
          else this.landGrid.get(key)!.overlayTileIdx = 16 // caminho de muralha horizontal
          occupied.add(key)
        }
      }

      // Bottom edge middle cells
      for (let gx = minGx + 1; gx < maxGx; gx++) {
        const key = `${gx}_${maxGy}`
        if (this.landGrid.has(key) && !occupied.has(key)) {
          const choice = rng()
          if (choice < 0.35)
            this.landGrid.get(key)!.overlayTileIdx = 48 // muralha na horizontal com canhao apontando para baixo
          else if (choice < 0.55)
            this.landGrid.get(key)!.overlayTileIdx = 76 // muralha na horizontal com portao
          else if (choice < 0.75)
            this.landGrid.get(key)!.overlayTileIdx = 96 // muralha na horizontal com espaço para pessoas
          else if (choice < 0.88)
            this.landGrid.get(key)!.overlayTileIdx = 30 // torre de ligacao de muralhas na horizontal
          else this.landGrid.get(key)!.overlayTileIdx = 16 // caminho de muralha horizontal
          occupied.add(key)
        }
      }

      // Left edge middle cells
      for (let gy = minGy + 1; gy < maxGy; gy++) {
        const key = `${minGx}_${gy}`
        if (this.landGrid.has(key) && !occupied.has(key)) {
          const choice = rng()
          if (choice < 0.35)
            this.landGrid.get(key)!.overlayTileIdx = 32 // muralha na vertical com canhao apontando para a esquerda
          else if (choice < 0.55)
            this.landGrid.get(key)!.overlayTileIdx = 60 // muralha na vertical com portao
          else if (choice < 0.75)
            this.landGrid.get(key)!.overlayTileIdx = 95 // muralha na vertical com espaço para pessoas
          else if (choice < 0.88)
            this.landGrid.get(key)!.overlayTileIdx = 29 // torre de ligacao de muralhas na vertical
          else this.landGrid.get(key)!.overlayTileIdx = 15 // caminho de muralha vertical
          occupied.add(key)
        }
      }

      // Right edge middle cells
      for (let gy = minGy + 1; gy < maxGy; gy++) {
        const key = `${maxGx}_${gy}`
        if (this.landGrid.has(key) && !occupied.has(key)) {
          const choice = rng()
          if (choice < 0.35)
            this.landGrid.get(key)!.overlayTileIdx = 31 // muralha na vertical com canhao apontando para a direita
          else if (choice < 0.55)
            this.landGrid.get(key)!.overlayTileIdx = 60 // muralha na vertical com portao
          else if (choice < 0.75)
            this.landGrid.get(key)!.overlayTileIdx = 95 // muralha na vertical com espaço para pessoas
          else if (choice < 0.88)
            this.landGrid.get(key)!.overlayTileIdx = 29 // torre de ligacao de muralhas na vertical
          else this.landGrid.get(key)!.overlayTileIdx = 15 // caminho de muralha vertical
          occupied.add(key)
        }
      }
    } else if (iw >= 2 && rng() < 0.5) {
      // 2. Horizontal Wall Line (Full Wall Line or Ruined Wall Line)
      const lineGy = minGy + Math.floor(rng() * ih)
      const validLineCells: number[] = []
      for (let gx = minGx; gx <= maxGx; gx++) {
        if (this.landGrid.has(`${gx}_${lineGy}`)) validLineCells.push(gx)
      }

      if (validLineCells.length >= 2) {
        const isRuinsLine = rng() < 0.35 // Ruined wall line vs connected full wall line
        const startX = validLineCells[0]
        const endX = validLineCells[validLineCells.length - 1]

        for (let i = 0; i < validLineCells.length; i++) {
          const gx = validLineCells[i]
          const key = `${gx}_${lineGy}`
          if (occupied.has(key)) continue

          if (isRuinsLine) {
            // Connected ruined wall line (2+ connected tiles)
            this.landGrid.get(key)!.overlayTileIdx = getRandomChoice([89, 90, 91, 92])
          } else {
            // Connected full wall line
            if (gx === startX) {
              this.landGrid.get(key)!.overlayTileIdx = rng() < 0.5 ? 46 : 64 // fim esquerdo de muralha na horizontal com/sem torre
            } else if (gx === endX) {
              this.landGrid.get(key)!.overlayTileIdx = rng() < 0.5 ? 62 : 80 // fim direito de muralha na horizontal com/sem torre
            } else {
              const choice = rng()
              if (choice < 0.3)
                this.landGrid.get(key)!.overlayTileIdx = 47 // canhao apontando para cima
              else if (choice < 0.6)
                this.landGrid.get(key)!.overlayTileIdx = 48 // canhao apontando para baixo
              else if (choice < 0.8)
                this.landGrid.get(key)!.overlayTileIdx = 76 // portao horizontal
              else this.landGrid.get(key)!.overlayTileIdx = 16 // caminho muralha horizontal
            }
          }
          occupied.add(key)
        }
      }
    } else if (ih >= 2 && rng() < 0.5) {
      // 3. Vertical Wall Line (Full Wall Line or Ruined Wall Line)
      const lineGx = minGx + Math.floor(rng() * iw)
      const validLineCells: number[] = []
      for (let gy = minGy; gy <= maxGy; gy++) {
        if (this.landGrid.has(`${lineGx}_${gy}`)) validLineCells.push(gy)
      }

      if (validLineCells.length >= 2) {
        const isRuinsLine = rng() < 0.35 // Ruined wall line vs connected full wall line
        const startY = validLineCells[0]
        const endY = validLineCells[validLineCells.length - 1]

        for (let i = 0; i < validLineCells.length; i++) {
          const gy = validLineCells[i]
          const key = `${lineGx}_${gy}`
          if (occupied.has(key)) continue

          if (isRuinsLine) {
            // Connected ruined wall line (2+ connected tiles)
            this.landGrid.get(key)!.overlayTileIdx = getRandomChoice([89, 90, 91, 92])
          } else {
            // Connected full wall line
            if (gy === startY) {
              this.landGrid.get(key)!.overlayTileIdx = rng() < 0.5 ? 45 : 63 // fim superior de muralha na vertical com/sem torre
            } else if (gy === endY) {
              this.landGrid.get(key)!.overlayTileIdx = rng() < 0.5 ? 61 : 79 // fim inferior da muralha na vertical com/sem torre
            } else {
              const choice = rng()
              if (choice < 0.3)
                this.landGrid.get(key)!.overlayTileIdx = 31 // canhao apontando para a direita
              else if (choice < 0.6)
                this.landGrid.get(key)!.overlayTileIdx = 32 // canhao apontando para a esquerda
              else if (choice < 0.8)
                this.landGrid.get(key)!.overlayTileIdx = 60 // portao vertical
              else this.landGrid.get(key)!.overlayTileIdx = 15 // caminho muralha vertical
            }
          }
          occupied.add(key)
        }
      }
    }

    // 4. Standalone towers on remaining cells (NO isolated single-tile walls or ruins)
    for (const cell of islandCells) {
      const key = `${cell.gx}_${cell.gy}`
      if (occupied.has(key)) continue

      const randVal = rng()
      if (randVal < 0.05) {
        this.landGrid.get(key)!.overlayTileIdx = getRandomChoice([13, 14]) // torre sozinha ou variante
        occupied.add(key)
      }
    }

    // 5. Rocks & Foliage on remaining open land cells
    const rockTiles = [49, 50, 51, 65, 66, 67] // pedra pequena, grande, media, musgo
    const plantTiles = [70, 71, 72, 87, 88] // planta pequena, grande, media, mato, mais mato

    for (const cell of islandCells) {
      const key = `${cell.gx}_${cell.gy}`
      if (occupied.has(key)) continue

      const randVal = rng()
      if (isSand) {
        if (randVal < 0.35) {
          this.landGrid.get(key)!.overlayTileIdx = getRandomChoice(rockTiles)
          occupied.add(key)
        } else if (randVal < 0.6) {
          this.landGrid.get(key)!.overlayTileIdx = getRandomChoice(plantTiles)
          occupied.add(key)
        }
      } else {
        if (randVal < 0.4) {
          this.landGrid.get(key)!.overlayTileIdx = getRandomChoice(plantTiles)
          occupied.add(key)
        } else if (randVal < 0.7) {
          this.landGrid.get(key)!.overlayTileIdx = getRandomChoice(rockTiles)
          occupied.add(key)
        }
      }
    }
  }

  /**
   * Pre-generates terrain grid for chunk (cx, cy) and enforces 4-tile distance gap from existing land cells.
   * Runs multiple placement attempts to double island quantity and frequency per chunk.
   */
  public pregenerateChunkTerrain(cx: number, cy: number) {
    const chunkKey = `${cx}_${cy}`
    if (this.pregeneratedChunks.has(chunkKey)) return
    this.pregeneratedChunks.add(chunkKey)

    // Up to 8 island generation attempts per chunk to double island density once again
    for (let attempt = 0; attempt < 8; attempt++) {
      const rng = seedRandom(cx, cy, attempt + 1)

      // ~85% probability of attempting an island spawn per attempt
      if (rng() > 0.85) continue

      const type: IslandType = rng() < 0.5 ? 'sand' : 'grass'
      const pattern = this.generateProceduralPattern(type, rng)
      const pRows = pattern.length
      const pCols = pattern[0].length

      // Ensure islands sit cleanly inside chunk with 2-tile margin from chunk edges
      const minC = 2
      const maxC = Math.max(minC, this.chunkTiles - pCols - 2)
      const minR = 2
      const maxR = Math.max(minR, this.chunkTiles - pRows - 2)

      const startLocalC = minC + Math.floor(rng() * Math.max(1, maxC - minC + 1))
      const startLocalR = minR + Math.floor(rng() * Math.max(1, maxR - minR + 1))

      const startGx = cx * this.chunkTiles + startLocalC
      const startGy = cy * this.chunkTiles + startLocalR

      const islandId = `island_${cx}_${cy}_${attempt}`

      // Validate 4-tile minimum distance buffer requirement from any existing island land cell
      let validGap = true
      for (let pr = 0; pr < pRows; pr++) {
        for (let pc = 0; pc < pCols; pc++) {
          if (pattern[pr][pc] === 1) {
            const gx = startGx + pc
            const gy = startGy + pr

            for (let dr = -4; dr <= 4; dr++) {
              for (let dc = -4; dc <= 4; dc++) {
                const checkKey = `${gx + dc}_${gy + dr}`
                const existing = this.landGrid.get(checkKey)
                if (existing && existing.islandId !== islandId) {
                  validGap = false
                  break
                }
              }
              if (!validGap) break
            }
          }
          if (!validGap) break
        }
      }

      if (validGap) {
        const islandCells: { gx: number; gy: number }[] = []
        for (let pr = 0; pr < pRows; pr++) {
          for (let pc = 0; pc < pCols; pc++) {
            if (pattern[pr][pc] === 1) {
              const gx = startGx + pc
              const gy = startGy + pr
              this.landGrid.set(`${gx}_${gy}`, { type, islandId })
              islandCells.push({ gx, gy })
            }
          }
        }
        // Generate connected overlay structures (Walls, towers, cannons, rocks, plants)
        this.generateIslandOverlays(islandCells, rng)
      }
    }
  }

  /**
   * Loads, autotiles, and builds the visual PixiJS container for chunk (cx, cy).
   */
  public loadChunk(cx: number, cy: number): Chunk {
    const key = `${cx}_${cy}`
    if (this.loadedChunks.has(key)) {
      return this.loadedChunks.get(key)!
    }

    // Ensure terrain for this chunk and its 1-ring neighbors are pregenerated
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.pregenerateChunkTerrain(cx + dx, cy + dy)
      }
    }

    const chunkContainer = new Container()
    chunkContainer.label = `Chunk_${cx}_${cy}`
    chunkContainer.cullable = true
    const obstacles: IslandObstacle[] = []
    const wallCannons: WallCannon[] = []

    const startGx = cx * this.chunkTiles
    const startGy = cy * this.chunkTiles

    const waterTexture = this.getTileTexture(73)
    const oceanCols = Math.ceil(this.chunkWidthPx / this.oceanTileSize)
    const oceanRows = Math.ceil(this.chunkWidthPx / this.oceanTileSize)

    // 1. Layer 1: Water Background Layer (Base ocean water tile_73 scaled 2x to 256px)
    for (let r = 0; r < oceanRows; r++) {
      for (let c = 0; c < oceanCols; c++) {
        const waterSprite = new Sprite(waterTexture)
        waterSprite.x = startGx * this.tileSize + c * this.oceanTileSize
        waterSprite.y = startGy * this.tileSize + r * this.oceanTileSize
        waterSprite.width = this.oceanTileSize
        waterSprite.height = this.oceanTileSize
        chunkContainer.addChild(waterSprite)
      }
    }

    const specialSandTiles = [81, 83, 85]
    const specialGrassTiles = [82, 84, 86]
    const specialEdgeUsed: Set<string> = new Set()

    const rng = seedRandom(cx, cy, 2)
    const getRandomChoice = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

    // 2. Layer 2: Submerged Island Base Layer & Submerged Coastline Border Ring
    for (let localR = 0; localR < this.chunkTiles; localR++) {
      for (let localC = 0; localC < this.chunkTiles; localC++) {
        const gx = startGx + localC
        const gy = startGy + localR
        const isLandCell = this.isLand(gx, gy)

        const N = this.isLand(gx, gy - 1)
        const S = this.isLand(gx, gy + 1)
        const W = this.isLand(gx - 1, gy)
        const E = this.isLand(gx + 1, gy)

        const NW = this.isLand(gx - 1, gy - 1)
        const NE = this.isLand(gx + 1, gy - 1)
        const SW = this.isLand(gx - 1, gy + 1)
        const SE = this.isLand(gx + 1, gy + 1)

        const posX = gx * this.tileSize
        const posY = gy * this.tileSize

        if (isLandCell) {
          // Under ALL land cells: Render full submerged shallow water base (tile 27)
          const subSprite = new Sprite(this.getTileTexture(27))
          subSprite.x = posX
          subSprite.y = posY
          subSprite.width = this.tileSize
          subSprite.height = this.tileSize
          chunkContainer.addChild(subSprite)
        } else {
          // Coastal water cells: Render submerged border tile ring
          let submergedTileIdx: number | null = null
          const cardinalCount = (N ? 1 : 0) + (S ? 1 : 0) + (W ? 1 : 0) + (E ? 1 : 0)

          if (cardinalCount >= 3) {
            submergedTileIdx = 27 // Parte completa de ilha submersa (golfo)
          } else if (S && E && SE) {
            submergedTileIdx = 75 // Acompanha canto superior esquerdo de dobra
          } else if (S && W && SW) {
            submergedTileIdx = 74 // Acompanha canto superior direito de dobra
          } else if (N && E && NE) {
            submergedTileIdx = 59 // Acompanha canto inferior esquerdo de dobra
          } else if (N && W && NW) {
            submergedTileIdx = 58 // Acompanha canto inferior direito de dobra
          } else if ((S && E) || (!N && !S && !W && !E && SE)) {
            submergedTileIdx = 10 // Canto superior esquerdo submerso
          } else if ((S && W) || (!N && !S && !W && !E && SW)) {
            submergedTileIdx = 12 // Canto superior direito submerso
          } else if ((N && E) || (!N && !S && !W && !E && NE)) {
            submergedTileIdx = 42 // Canto inferior esquerdo submerso
          } else if ((N && W) || (!N && !S && !W && !E && NW)) {
            submergedTileIdx = 44 // Canto inferior direito submerso
          } else if (S) {
            submergedTileIdx = 11 // Borda superior submersa
          } else if (N) {
            submergedTileIdx = 43 // Borda inferior submersa
          } else if (E) {
            submergedTileIdx = 26 // Borda esquerda submersa
          } else if (W) {
            submergedTileIdx = 28 // Borda direita submersa
          }

          if (submergedTileIdx !== null) {
            const subSprite = new Sprite(this.getTileTexture(submergedTileIdx))
            subSprite.x = posX
            subSprite.y = posY
            subSprite.width = this.tileSize
            subSprite.height = this.tileSize
            chunkContainer.addChild(subSprite)
          }
        }
      }
    }

    // 3. Layer 3: Solid Land Tiles (Sand & Grass Tiles)
    for (let localR = 0; localR < this.chunkTiles; localR++) {
      for (let localC = 0; localC < this.chunkTiles; localC++) {
        const gx = startGx + localC
        const gy = startGy + localR
        const cell = this.landGrid.get(`${gx}_${gy}`)
        if (!cell) continue

        const type = cell.type
        const islandId = cell.islandId

        const N = this.isLand(gx, gy - 1)
        const S = this.isLand(gx, gy + 1)
        const W = this.isLand(gx - 1, gy)
        const E = this.isLand(gx + 1, gy)

        const NW = this.isLand(gx - 1, gy - 1)
        const NE = this.isLand(gx + 1, gy - 1)
        const SW = this.isLand(gx - 1, gy + 1)
        const SE = this.isLand(gx + 1, gy + 1)

        let tileIdx = 2
        let rotation = 0

        const specialTile = getRandomChoice(type === 'sand' ? specialSandTiles : specialGrassTiles)

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
          } else if (S && E && !SE) {
            tileIdx = 4 // Canto inferior direito de dobra de areia
          } else if (S && W && !SW) {
            tileIdx = 5 // Canto inferior esquerdo de dobra de areia
          } else if (N && E && !NE) {
            tileIdx = 20 // Canto superior direito de dobra de areia
          } else if (N && W && !NW) {
            tileIdx = 21 // Canto superior esquerdo de dobra de areia
          } else if (!N) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = Math.PI // 180° for top edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = 2 // Top edge
            }
          } else if (!S) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = 0 // 0° for bottom edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = 34 // Bottom edge
            }
          } else if (!W) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = Math.PI / 2 // 90° for left edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = 17 // Left edge
            }
          } else if (!E) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = (3 * Math.PI) / 2 // 270° for right edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = 19 // Right edge
            }
          } else {
            const rand = rng()
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
          } else if (S && E && !SE) {
            tileIdx = 36 // Canto inferior direito de dobra da ilha com grama
          } else if (S && W && !SW) {
            tileIdx = 37 // Canto inferior esquerdo de dobra da ilha com grama
          } else if (N && E && !NE) {
            tileIdx = 52 // Canto superior direito de dobra da ilha com grama
          } else if (N && W && !NW) {
            tileIdx = 53 // Canto superior esquerdo de dobra da ilha com grama
          } else if (!N) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = Math.PI // 180° for top edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = getRandomChoice([7, 8]) // Top edge grass
            }
          } else if (!S) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = 0 // 0° for bottom edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = getRandomChoice([55, 56]) // Bottom edge grass
            }
          } else if (!W) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = Math.PI / 2 // 90° for left edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = 22 // Left edge grass
            }
          } else if (!E) {
            if (!specialEdgeUsed.has(islandId) && rng() < 0.35) {
              tileIdx = specialTile
              rotation = (3 * Math.PI) / 2 // 270° for right edge
              specialEdgeUsed.add(islandId)
            } else {
              tileIdx = getRandomChoice([25, 41]) // Right edge grass
            }
          } else {
            const rand = rng()
            if (rand < 0.25) {
              tileIdx = 24 // Grass with flowers
            } else if (rand < 0.5) {
              tileIdx = getRandomChoice([39, 40]) // Grass with medium bushes
            } else {
              tileIdx = 23 // Standard grass center
            }
          }
        }

        const posX = gx * this.tileSize
        const posY = gy * this.tileSize

        const landSprite = new Sprite(this.getTileTexture(tileIdx))

        if (rotation !== 0) {
          landSprite.anchor.set(0.5, 0.5)
          landSprite.x = posX + this.tileSize / 2
          landSprite.y = posY + this.tileSize / 2
          landSprite.rotation = rotation
        } else {
          landSprite.x = posX
          landSprite.y = posY
        }

        landSprite.width = this.tileSize
        landSprite.height = this.tileSize
        chunkContainer.addChild(landSprite)

        // 4. Layer 4: Overlay Tiles (Fortresses, Walls, Towers, Cannons, Rocks, Vegetation)
        if (cell.overlayTileIdx !== undefined) {
          const overlaySprite = new Sprite(this.getTileTexture(cell.overlayTileIdx))
          overlaySprite.anchor.set(0.5, 0.5)
          overlaySprite.x = posX + this.tileSize / 2
          overlaySprite.y = posY + this.tileSize / 2

          // Standard 100% tile size for walls, towers, cannons, gates, rocks, and foliage
          overlaySprite.width = this.tileSize
          overlaySprite.height = this.tileSize

          chunkContainer.addChild(overlaySprite)

          let cannonAngle: number | null = null
          if (cell.overlayTileIdx === 31)
            cannonAngle = Math.PI / 2 // RIGHT
          else if (cell.overlayTileIdx === 32)
            cannonAngle = (3 * Math.PI) / 2 // LEFT
          else if (cell.overlayTileIdx === 47)
            cannonAngle = 0 // UP
          else if (cell.overlayTileIdx === 48) cannonAngle = Math.PI // DOWN

          if (cannonAngle !== null) {
            wallCannons.push({
              id: `cannon_${gx}_${gy}`,
              x: posX + this.tileSize / 2,
              y: posY + this.tileSize / 2,
              angle: cannonAngle,
              fireTimer: rng() * 1.5,
              cooldown: 2.5,
            })
          }
        }

        // Register solid land obstacle circle for physics collisions
        obstacles.push({
          x: posX + this.tileSize / 2,
          y: posY + this.tileSize / 2,
          radius: this.tileSize * 0.48,
        })
      }
    }

    const chunk: Chunk = {
      key,
      cx,
      cy,
      container: chunkContainer,
      obstacles,
      wallCannons,
    }

    this.loadedChunks.set(key, chunk)
    this.worldContainer.addChild(chunkContainer)

    return chunk
  }

  public getActiveWallCannons(): WallCannon[] {
    const cannons: WallCannon[] = []
    this.loadedChunks.forEach((chunk) => {
      cannons.push(...chunk.wallCannons)
    })
    return cannons
  }

  /**
   * Updates loaded active chunks dynamically around current player position.
   * Generates new chunks as player approaches map edges so world never ends.
   */
  public updatePlayerPosition(
    playerX: number,
    playerY: number,
  ): {
    obstacles: IslandObstacle[]
    activeChunkKeys: string[]
  } {
    const centerCx = Math.floor(playerX / this.chunkWidthPx)
    const centerCy = Math.floor(playerY / this.chunkWidthPx)

    if (centerCx === this.lastCenterCx && centerCy === this.lastCenterCy) {
      return {
        obstacles: this.cachedObstacles,
        activeChunkKeys: this.cachedActiveKeys,
      }
    }

    this.lastCenterCx = centerCx
    this.lastCenterCy = centerCy

    // Pregenerate terrain for active chunks and surrounding 2-chunk neighborhood
    for (let dy = -this.renderRadius - 2; dy <= this.renderRadius + 2; dy++) {
      for (let dx = -this.renderRadius - 2; dx <= this.renderRadius + 2; dx++) {
        this.pregenerateChunkTerrain(centerCx + dx, centerCy + dy)
      }
    }

    const requiredKeys = new Set<string>()

    for (let dy = -this.renderRadius; dy <= this.renderRadius; dy++) {
      for (let dx = -this.renderRadius; dx <= this.renderRadius; dx++) {
        const cx = centerCx + dx
        const cy = centerCy + dy
        const key = `${cx}_${cy}`
        requiredKeys.add(key)
        if (!this.loadedChunks.has(key)) {
          this.loadChunk(cx, cy)
        }
      }
    }

    const allObstacles: IslandObstacle[] = []

    // Unload far chunks outside render radius + 1
    this.loadedChunks.forEach((chunk, key) => {
      if (!requiredKeys.has(key)) {
        const dist = Math.max(Math.abs(chunk.cx - centerCx), Math.abs(chunk.cy - centerCy))
        if (dist > this.renderRadius + 1) {
          this.worldContainer.removeChild(chunk.container)
          chunk.container.destroy({ children: true })
          this.loadedChunks.delete(key)
        }
      } else {
        allObstacles.push(...chunk.obstacles)
      }
    })

    this.cachedObstacles = allObstacles
    this.cachedActiveKeys = Array.from(requiredKeys)

    return {
      obstacles: allObstacles,
      activeChunkKeys: this.cachedActiveKeys,
    }
  }

  /**
   * Garbage collects landGrid cells and pregeneratedChunks entries that are far from player position.
   */
  public purgeFarMetadata(centerCx: number, centerCy: number, maxChunkRadius = 6) {
    // Purge landGrid cells
    this.landGrid.forEach((_cell, key) => {
      const parts = key.split('_')
      if (parts.length === 2) {
        const gx = Number.parseInt(parts[0], 10)
        const gy = Number.parseInt(parts[1], 10)
        const cx = Math.floor(gx / this.chunkTiles)
        const cy = Math.floor(gy / this.chunkTiles)

        if (Math.abs(cx - centerCx) > maxChunkRadius || Math.abs(cy - centerCy) > maxChunkRadius) {
          this.landGrid.delete(key)
        }
      }
    })

    // Purge pregeneratedChunks keys
    this.pregeneratedChunks.forEach((key) => {
      const parts = key.split('_')
      if (parts.length === 2) {
        const cx = Number.parseInt(parts[0], 10)
        const cy = Number.parseInt(parts[1], 10)

        if (Math.abs(cx - centerCx) > maxChunkRadius || Math.abs(cy - centerCy) > maxChunkRadius) {
          this.pregeneratedChunks.delete(key)
        }
      }
    })
  }

  public clear() {
    this.loadedChunks.forEach((chunk) => {
      this.worldContainer.removeChild(chunk.container)
      chunk.container.destroy({ children: true })
    })
    this.loadedChunks.clear()
    this.landGrid.clear()
    this.pregeneratedChunks.clear()
  }
}
