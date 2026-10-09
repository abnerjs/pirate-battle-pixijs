export interface InputState {
  moveForward: boolean
  turnLeft: boolean
  turnRight: boolean
  fireLeft: boolean
  fireFront: boolean
  fireRight: boolean
}

export class InputController {
  private keys: Record<string, boolean> = {}

  public touchMoveForward = false
  public touchTurnLeft = false
  public touchTurnRight = false

  public onFrontAttack?: () => void
  public onLeftBroadside?: () => void
  public onRightBroadside?: () => void
  public onTogglePause?: () => void

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key] = true
    this.keys[e.code] = true

    if (e.code === 'Space' || e.key === ' ') {
      if (this.onFrontAttack) this.onFrontAttack()
    }
    if (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ') {
      if (this.onLeftBroadside) this.onLeftBroadside()
    }
    if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
      if (this.onRightBroadside) this.onRightBroadside()
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (this.onTogglePause) this.onTogglePause()
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key] = false
    this.keys[e.code] = false
  }

  public attach() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  public detach() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.keys = {}
  }

  public getInputState(): InputState {
    const moveForward =
      !!this.keys.w ||
      !!this.keys.W ||
      !!this.keys.ArrowUp ||
      !!this.keys.KeyW ||
      this.touchMoveForward

    const turnLeft =
      !!this.keys.a ||
      !!this.keys.A ||
      !!this.keys.ArrowLeft ||
      !!this.keys.KeyA ||
      this.touchTurnLeft

    const turnRight =
      !!this.keys.d ||
      !!this.keys.D ||
      !!this.keys.ArrowRight ||
      !!this.keys.KeyD ||
      this.touchTurnRight

    const fireLeft = !!this.keys.q || !!this.keys.Q || !!this.keys.KeyQ

    const fireFront = !!this.keys.Space || !!this.keys[' ']

    const fireRight = !!this.keys.e || !!this.keys.E || !!this.keys.KeyE

    return { moveForward, turnLeft, turnRight, fireLeft, fireFront, fireRight }
  }
}
