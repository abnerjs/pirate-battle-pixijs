import { describe, expect, it } from 'vitest'

describe('Math utilities test', () => {
  it('correctly calculates distance between two points', () => {
    const dx = 4
    const dy = 3
    const distance = Math.sqrt(dx * dx + dy * dy)
    expect(distance).toBe(5)
  })
})
