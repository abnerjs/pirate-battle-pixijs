// Sound Manager utility for UI and gameplay audio feedback
class SoundManager {
  private isMuted: boolean = false

  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  public playSound(soundName: string, volume: number = 1) {
    if (this.isMuted) return

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
}

export const soundManager = new SoundManager()
