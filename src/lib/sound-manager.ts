// Sound Manager utility for UI and gameplay audio feedback
class SoundManager {
  public playSound(soundName: string, volume: number = 1) {
    try {
      const src = `/assets/sounds/${soundName}`
      const audio = new Audio(src)
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.play().catch(() => {
        // Autoplay restrictions or missing audio handled gracefully
      })
    } catch (_e) {
      // Ignore audio failure
    }
  }

  public playClick() {
    this.playSound('ui_click.wav', 0.6)
  }

  public playHover() {
    this.playSound('ui_hover.wav', 0.25)
  }

  public playOpen() {
    this.playSound('ui_open.wav', 0.5)
  }

  public playClose() {
    this.playSound('ui_close.wav', 0.5)
  }

  public playStart() {
    this.playSound('game_start.wav', 0.7)
  }

  public playCannonFire() {
    this.playSound('cannon_fire_1.wav', 0.5)
  }

  public playBroadside() {
    this.playSound('cannon_broadside.wav', 0.6)
  }

  public playShipHit() {
    this.playSound('ship_wood_hit_1.wav', 0.5)
  }

  public playWaterHit() {
    this.playSound('cannonball_water_hit_1.wav', 0.4)
  }

  public playExplosion() {
    this.playSound('ship_explosion_1.wav', 0.7)
  }

  public playScore() {
    this.playSound('score_point.wav', 0.5)
  }

  public playGameOver() {
    this.playSound('game_over.wav', 0.7)
  }

  public playVictory() {
    this.playSound('game_complete.wav', 0.7)
  }
}

export const soundManager = new SoundManager()
