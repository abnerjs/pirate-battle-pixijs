import { describe, expect, it, vi } from 'vitest'

// Mock pixi.js to avoid WebGL/Canvas dependencies during headless unit tests
vi.mock('pixi.js', () => {
  class Container {
    public label = ''
    public children: unknown[] = []
    public addChild(child: unknown) {
      this.children.push(child)
    }
    public removeChild(child: unknown) {
      const idx = this.children.indexOf(child)
      if (idx !== -1) this.children.splice(idx, 1)
    }
    public destroy(_opts?: unknown) {
      this.children = []
    }
  }

  class Sprite {
    public x = 0
    public y = 0
    public width = 0
    public height = 0
    public rotation = 0
    public anchor = {
      set: (_x: number, _y: number) => {},
    }
    constructor(public texture?: unknown) {}
  }

  class Texture {
    public valid = true
    static from(_url: string) {
      return new Texture()
    }
  }

  return {
    Container,
    Sprite,
    Texture,
  }
})

import { Container } from 'pixi.js'
import { ChunkManager, seedRandom } from './chunk-manager'

describe('ChunkManager Procedural Infinite Generation', () => {
  it('generates deterministic random numbers based on coordinates and offset', () => {
    const rng1 = seedRandom(5, -3, 1)
    const rng2 = seedRandom(5, -3, 1)
    const rngDiff = seedRandom(5, -3, 2)

    const val1 = [rng1(), rng1(), rng1()]
    const val2 = [rng2(), rng2(), rng2()]
    const valDiff = [rngDiff(), rngDiff(), rngDiff()]

    expect(val1).toEqual(val2)
    expect(val1).not.toEqual(valDiff)
  })

  it('loads active 5x5 chunks grid around player initial position', () => {
    const worldContainer = new Container()
    const chunkManager = new ChunkManager(worldContainer, 128, 16, 2)

    // Player at (0, 0)
    const { activeChunkKeys, obstacles } = chunkManager.updatePlayerPosition(0, 0)

    // 5x5 active grid = 25 chunks (cx in [-2, 2], cy in [-2, 2])
    expect(activeChunkKeys.length).toBe(25)
    expect(chunkManager.loadedChunks.size).toBe(25)
    expect(activeChunkKeys).toContain('0_0')
    expect(activeChunkKeys).toContain('-2_-2')
    expect(activeChunkKeys).toContain('2_2')
    expect(obstacles.length).toBeGreaterThan(0)
  })

  it('loads new chunks dynamically and unloads far chunks when player moves', () => {
    const worldContainer = new Container()
    const chunkManager = new ChunkManager(worldContainer, 128, 16, 2)

    // Initial position at center of chunk 0,0
    chunkManager.updatePlayerPosition(1000, 1000)
    expect(chunkManager.loadedChunks.has('0_0')).toBe(true)
    expect(chunkManager.loadedChunks.has('10_10')).toBe(false)

    // Move player far away to chunk 10,10 (x = 10 * 2048 = 20480)
    const newPos = 10 * 16 * 128 + 500
    chunkManager.updatePlayerPosition(newPos, newPos)

    // Chunk 0,0 should now be unloaded (> radius + 1)
    expect(chunkManager.loadedChunks.has('0_0')).toBe(false)

    // Chunk 10,10 and its surroundings should now be loaded
    expect(chunkManager.loadedChunks.has('10_10')).toBe(true)
    expect(chunkManager.loadedChunks.has('9_9')).toBe(true)
    expect(chunkManager.loadedChunks.has('11_11')).toBe(true)
  })

  it('enforces a minimum 4-tile distance gap between distinct islands', () => {
    const worldContainer = new Container()
    const chunkManager = new ChunkManager(worldContainer, 128, 16, 3)

    // Pre-generate terrain across multiple adjacent chunks
    for (let cy = -2; cy <= 2; cy++) {
      for (let cx = -2; cx <= 2; cx++) {
        chunkManager.pregenerateChunkTerrain(cx, cy)
      }
    }

    const landCells = Array.from(chunkManager.landGrid.entries())

    // For every land cell, ensure any other land cell within 4 tiles belongs to the SAME island
    for (const [key1, cell1] of landCells) {
      const [x1, y1] = key1.split('_').map(Number)

      for (const [key2, cell2] of landCells) {
        if (key1 === key2) continue
        const [x2, y2] = key2.split('_').map(Number)

        const dx = Math.abs(x1 - x2)
        const dy = Math.abs(y1 - y2)

        if (dx <= 4 && dy <= 4) {
          expect(cell1.islandId).toBe(cell2.islandId)
        }
      }
    }
  })

  it('generates island patterns with minimum thickness (no 1-tile wide islands)', () => {
    const worldContainer = new Container()
    const chunkManager = new ChunkManager(worldContainer, 128, 16, 2)
    const rng = seedRandom(42, 99, 1)

    for (let i = 0; i < 20; i++) {
      const pattern = chunkManager.generateProceduralPattern('sand', rng)
      expect(pattern.length).toBeGreaterThanOrEqual(2)
      expect(pattern[0].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('generates islands and loads chunks in negative coordinate space (up and left)', () => {
    const worldContainer = new Container()
    const chunkManager = new ChunkManager(worldContainer, 128, 16, 2)

    // Player at negative coordinates (-10000, -10000) -> cx = -5, cy = -5
    const { activeChunkKeys, obstacles } = chunkManager.updatePlayerPosition(-10000, -10000)

    expect(activeChunkKeys).toContain('-5_-5')
    expect(activeChunkKeys).toContain('-7_-7')
    expect(activeChunkKeys).toContain('-3_-3')
    expect(chunkManager.loadedChunks.has('-5_-5')).toBe(true)
    expect(obstacles.length).toBeGreaterThan(0)
  })

  it('clears all loaded chunks and terrain grid when clear() is called', () => {
    const worldContainer = new Container()
    const chunkManager = new ChunkManager(worldContainer, 128, 16, 2)

    chunkManager.updatePlayerPosition(0, 0)
    expect(chunkManager.loadedChunks.size).toBeGreaterThan(0)
    expect(chunkManager.landGrid.size).toBeGreaterThan(0)

    chunkManager.clear()
    expect(chunkManager.loadedChunks.size).toBe(0)
    expect(chunkManager.landGrid.size).toBe(0)
  })
})
