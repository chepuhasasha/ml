import { createDeepQNetwork } from './dqn'
import { SnakeGame } from './game'
import {
  train,
  tidy,
  tensor1d,
  scalar,
  oneHot,
  type Sequential,
  type AdamOptimizer,
  losses,
  variableGrads,
  dispose
} from '@tensorflow/tfjs'
import { Memory } from './memory'
import { getStateTensor } from './utils'

export class SnakeGameAgent {
  game: SnakeGame
  onlineNetwork: Sequential
  targetNetwork: Sequential
  optimizer: AdamOptimizer
  replayMemory: Memory
  frameCount: number = 0
  epsilon: number = 0
  epsilonIncrement_: number = 0
  fruitsEaten_: number = 0
  cumulativeReward_: number = 0

  constructor(
    private replayBufferSize: number,
    private epsilonInit: number,
    private epsilonFinal: number,
    private epsilonDecayFrames: number,
    private learningRate: number
  ) {
    this.game = new SnakeGame(9, 9, 1, 2)
    this.onlineNetwork = createDeepQNetwork(
      this.game.height,
      this.game.width,
      this.game.num_actions
    )
    this.targetNetwork = createDeepQNetwork(
      this.game.height,
      this.game.width,
      this.game.num_actions
    )
    this.targetNetwork.trainable = false
    this.optimizer = train.adam(this.learningRate)
    this.replayMemory = new Memory(this.replayBufferSize)
    this.reset()
  }

  reset() {
    this.cumulativeReward_ = 0
    this.fruitsEaten_ = 0
    this.game.reset()
  }

  playStep() {
    this.epsilon =
      this.frameCount >= this.epsilonDecayFrames
        ? this.epsilonFinal
        : this.epsilonInit + this.epsilonIncrement_ * this.frameCount
    this.frameCount++

    let action: number = 0
    const state = this.game.getState()
    if (Math.random() < this.epsilon) {
      action = this.game.randomAction()
    } else {
      tidy(() => {
        const stateTensor = getStateTensor(state, this.game.height, this.game.width)
        const predict = this.onlineNetwork.predict(stateTensor)
        if (Array.isArray(predict)) {
          action = this.game.all_actions[predict[0].argMax(-1).dataSync()[0]]
        } else {
          action = this.game.all_actions[predict.argMax(-1).dataSync()[0]]
        }
      })
    }
    const { state: next_state, reward, done, fruitEaten } = this.game.step(action, true)
    this.replayMemory.append({ state, action, reward, done, next_state })
    this.cumulativeReward_ += reward
    if (fruitEaten) {
      this.fruitsEaten_++
    }
    const output = {
      action,
      cumulativeReward: this.cumulativeReward_,
      done,
      fruitsEaten: this.fruitsEaten_
    }
    if (done) {
      this.reset()
    }
    return output
  }

  trainOnReplayBatch(batchSize: number, gamma: number, optimizer: any) {
    const batch = this.replayMemory.sample(batchSize)
    const lossFunction = () =>
      tidy(() => {
        const stateTensor = getStateTensor(
          batch.map((example) => example.state),
          this.game.height,
          this.game.width
        )
        const actionTensor = tensor1d(
          batch.map((example) => example.action),
          'int32'
        )
        const qs = this.onlineNetwork
          .apply(stateTensor, { training: true })
          // @ts-ignore
          .mul(oneHot(actionTensor, this.game.num_actions))
          .sum(-1)

        const rewardTensor = tensor1d(batch.map((example) => example.reward))
        const nextStateTensor = getStateTensor(
          batch.map((example) => example.next_state),
          this.game.height,
          this.game.width
        )
        // @ts-ignore
        const nextMaxQTensor = this.targetNetwork.predict(nextStateTensor).max(-1)
        const doneMask = scalar(1).sub(
          tensor1d(batch.map((example) => example.done)).asType('float32')
        )
        const targetQs = rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma))
        return losses.meanSquaredError(targetQs, qs)
      })
    // @ts-ignore
    const grads = variableGrads(lossFunction)
    optimizer.applyGradients(grads.grads)
    dispose(grads)
  }
}
