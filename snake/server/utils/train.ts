import type { SnakeGameAgent } from './agent'
import * as tf from '@tensorflow/tfjs'
import { copyWeights } from '@/common'

class MovingAverager {
  buffer: number[] = []
  constructor(bufferLength: number) {
    this.buffer = Array(bufferLength).fill(0)
  }

  append(x: number) {
    this.buffer.shift()
    this.buffer.push(x)
  }

  average() {
    return (
      this.buffer.reduce((x, prev) => {
        if (prev) {
          return x + prev
        } else {
          return x
        }
      }, 0) / this.buffer.length
    )
  }
}

export const train = async (
  agent: SnakeGameAgent,
  batchSize: number,
  gamma: number,
  learningRate: number,
  syncEveryFrames: number,
  cumulativeRewardThreshold: number,
  maxNumFrames: number,
  savePath: string
) => {
  for (let i = 0; i < agent.replayBufferSize; ++i) {
    console.log('replay')
    agent.playStep()
  }
  // Moving averager: cumulative reward across 100 most recent 100 episodes.
  const rewardAverager100 = new MovingAverager(100)
  // Moving averager: fruits eaten across 100 most recent 100 episodes.
  const eatenAverager100 = new MovingAverager(100)
  
  const optimizer = tf.train.adam(learningRate)
  let tPrev = new Date().getTime()
  let frameCountPrev = agent.frameCount
  let averageReward100Best = -Infinity
  const trainLoop = async () => {
    // @ts-ignore
    // if (!window.trainInProgress) {
    //   return
    // }
    agent.trainOnReplayBatch(batchSize, gamma, optimizer)
    const { cumulativeReward, done, fruitsEaten } = agent.playStep()
    console.log('train loop', done)

    if (done) {
      const t = new Date().getTime()
      const framesPerSecond = ((agent.frameCount - frameCountPrev) / (t - tPrev)) * 1e3
      tPrev = t
      frameCountPrev = agent.frameCount

      rewardAverager100.append(cumulativeReward)
      eatenAverager100.append(fruitsEaten)
      const averageReward100 = rewardAverager100.average()
      const averageEaten100 = eatenAverager100.average()
      console.log(
        `Frame #${agent.frameCount}: ` +
          `cumulativeReward100=${averageReward100.toFixed(1)}; ` +
          `eaten100=${averageEaten100.toFixed(2)} ` +
          `(epsilon=${agent.epsilon.toFixed(3)}) ` +
          `(${framesPerSecond.toFixed(1)} frames/s)`
      )
      if (averageReward100 >= cumulativeRewardThreshold || agent.frameCount >= maxNumFrames) {
        // TODO(cais): Save online network.
        return
      }
      if (averageReward100 > averageReward100Best) {
        averageReward100Best = averageReward100
        await agent.onlineNetwork.save(savePath)
        console.log(`Saved DQN to ${savePath}`)
      }
    }
    if (agent.frameCount % syncEveryFrames === 0) {
      copyWeights(agent.targetNetwork, agent.onlineNetwork)
      console.log("Sync'ed weights from online network to target network")
    }
    setTimeout(() => {
      trainLoop()
    }, 1000)
  }

  await trainLoop()
}
