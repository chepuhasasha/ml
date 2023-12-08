import { loadLayersModel, LayersModel, buffer, tidy } from '@tensorflow/tfjs'
import type { SnakeGame } from './game'

export class Player {
  dqn: LayersModel | null = null
  active: boolean = false
  interval: number = 0
  speed: number = 100

  constructor(public game: SnakeGame) {}

  public reset() {
    this.dqn = null,
    this.active = false
    clearInterval(this.interval)
    this.interval = 0
  }

  public async loadModel(url: string) {
    return await loadLayersModel(url).then((model) => {
      this.dqn = model
      console.log('Model loaded.')
      return this.dqn
    }).catch(() => {
      console.log('Failed to load model.')
      return null
    })
  }

  public getStateTensor() {
    const b = buffer([1, this.game.height, this.game.width, 2])
    const state = this.game.getState()
    state.s.forEach((yx, i) => {
      b.set(i === 0 ? 2 : 1, 0, yx[0], yx[1], 0)
    })
    state.f.forEach((yx) => {
      b.set(1, 0, yx[0], yx[1], 1)
    })
    return b.toTensor()
  }

  public predictAction() {
    let bestAction: null | number = null
    tidy(() => {
      if (this.dqn === null) return
      const stateTensor = this.getStateTensor()
      const predictOut = this.dqn.predict(stateTensor)
      if (Array.isArray(predictOut)) {
        bestAction = this.game.actions[predictOut[0].argMax(-1).dataSync()[0]]
      } else {
        bestAction = this.game.actions[predictOut.argMax(-1).dataSync()[0]]
      }
    })
    return bestAction
  }

  public playOrPause() {
    if (this.active) {
      if (this.interval) {
        clearInterval(this.interval)
      }
    } else {
      this.interval = setInterval(() => {
        const action = this.predictAction()
        if (action != null) {
          this.game.step(action)
        }
      }, this.speed)
    }
    this.active = !this.active
  }
}
