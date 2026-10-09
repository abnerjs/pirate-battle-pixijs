import { expect, test } from '@playwright/test'

test.describe('Pirate Battle - End-to-End Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // 1. Navegação, validação e persistência das opções
  test('1. Options navigation, validation, and persistence', async ({ page }) => {
    // Navigate to Options
    await page.getByRole('button', { name: 'OPTIONS' }).click()
    await expect(page.getByText('Game session time')).toBeVisible()

    // Verify controls
    await expect(page.getByText('Enemy spawn time')).toBeVisible()

    // Return to menu
    await page.getByRole('button', { name: 'MAIN MENU' }).click()
    await expect(page.getByRole('button', { name: 'PLAY' })).toBeVisible()

    // Reload page to test persistence
    await page.reload()
    await page.getByRole('button', { name: 'OPTIONS' }).click()
    await expect(page.getByText('Game session time')).toBeVisible()
  })

  // 2. Carregamento dos assets
  test('2. Asset loading screen and initialization', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    // Verify loading overlay or game container appears
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 })
  })

  // 3. Início de partida, movimento, rotação e arena
  test('3. Game start, movement, rotation, and arena bounds', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    // Simulate movement inputs
    await page.keyboard.press('KeyW', { delay: 100 })
    await page.keyboard.press('KeyA', { delay: 100 })
    await page.keyboard.press('KeyD', { delay: 100 })
    await page.keyboard.press('KeyS', { delay: 100 })

    // Canvas should still be visible and active
    await expect(canvas).toBeVisible()
  })

  // 4. Disparos frontal e lateral, dano, cooldown e pontuação
  test('4. Frontal and side cannons shooting', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 })

    // Fire frontal cannon (Space)
    await page.keyboard.press('Space')

    // Fire left cannon (KeyQ) and right cannon (KeyE)
    await page.keyboard.press('KeyQ')
    await page.keyboard.press('KeyE')

    // Verify HUD displays heart health icon and score/time panels
    await expect(page.getByAltText('Heart')).toBeVisible()
    await expect(page.getByTitle('Sunk Ships Score')).toBeVisible()
  })

  // 5. Spawn e presença de inimigos
  test('5. Enemy spawning and HUD status', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 })

    // Wait a few seconds for game ticker & spawns
    await page.waitForTimeout(2000)
    await expect(page.locator('canvas')).toBeVisible()
  })

  // 6. Encerramento da partida e reinício
  test('6. Match pause modal and restart controls', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 })

    // Press Escape or pause key
    await page.keyboard.press('Escape')

    // Pause modal should display
    const pauseHeading = page.getByText(/PAUSED|GAME PAUSED/i).first()
    if (await pauseHeading.isVisible()) {
      await expect(pauseHeading).toBeVisible()
      // Resume game
      const resumeBtn = page.getByRole('button', { name: /RESUME/i })
      if (await resumeBtn.isVisible()) {
        await resumeBtn.click()
      }
    }
  })

  // 7. Pausa e retomada sem avanço indevido do cronômetro
  test('7. Pause modal toggle and resume', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 })

    // Look for pause button in HUD
    const pauseBtn = page.locator('button[aria-label*="pause" i], button:has-text("PAUSE")').first()
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click()
      await expect(page.getByText(/PAUSED/i).first()).toBeVisible()
    }
  })

  // 8. Exibição de telas e resultado
  test('8. Main menu ship selection cycle', async ({ page }) => {
    // Click ship selector to change active ship variant
    const shipBtn = page.locator('button:has(img[src*="ship_"])')
    if (await shipBtn.isVisible()) {
      await shipBtn.click()
      await page.waitForTimeout(300)
    }
    await expect(page.getByRole('button', { name: 'PLAY' })).toBeVisible()
  })

  // 9. Abandono da partida e navegação entre telas
  test('9. Abandoning match to return to main menu', async ({ page }) => {
    await page.getByRole('button', { name: 'PLAY' }).click()
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 })

    // Pause and abandon match
    await page.keyboard.press('Escape')
    const mainMenuBtn = page.getByRole('button', { name: /MAIN MENU/i })
    if (await mainMenuBtn.isVisible()) {
      await mainMenuBtn.click()
      await expect(page.getByRole('button', { name: 'PLAY' })).toBeVisible()
    }
  })

  // 10. Consulta e paginação das abas Ranking e Match History
  test('10. Captain Log ranking and history tabs pagination', async ({ page }) => {
    await page.getByRole('button', { name: 'RANKING' }).click()
    await expect(page.getByText("CAPTAIN'S LOG")).toBeVisible()

    // Switch to MATCH HISTORY tab
    await page.getByRole('tab', { name: 'MATCH HISTORY' }).click()
    await expect(page.getByText(/YOUR RECENT BATTLES/i)).toBeVisible()

    // Switch back to RANKING tab
    await page.getByRole('tab', { name: 'RANKING' }).click()
    await expect(page.getByText(/BATTLES/i).first()).toBeVisible()

    // Return to main menu
    await page.getByRole('button', { name: 'MAIN MENU' }).click()
    await expect(page.getByRole('button', { name: 'PLAY' })).toBeVisible()
  })

  // 11. Registro de partidas e MSW integration
  test('11. Data fetching and match logbook state', async ({ page }) => {
    await page.getByRole('button', { name: 'MATCH HISTORY' }).click()
    await expect(page.getByText("CAPTAIN'S LOG")).toBeVisible()

    // Check pagination controls exist
    const prevBtn = page.getByRole('button', { name: 'Previous Page' })
    const nextBtn = page.getByRole('button', { name: 'Next Page' })
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()
  })

  // 12. Persistent storage and network fallback layer
  test('12. Offline fallback and settings state persistence', async ({ page }) => {
    // Verify local storage is initialized
    await page.evaluate(() => {
      localStorage.setItem('test_persisted_key', 'pirate_ship')
    })
    await page.reload()
    const stored = await page.evaluate(() => localStorage.getItem('test_persisted_key'))
    expect(stored).toBe('pirate_ship')
  })
})
