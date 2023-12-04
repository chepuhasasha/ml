import type { State } from './game'
import { LayersModel, buffer } from '@tensorflow/tfjs'

export const getStateTensor = (state: State | State[], h: number, w: number) => {
  if (!Array.isArray(state)) {
    state = [state]
  }
  const numExamples = state.length
  const b = buffer([numExamples, h, w, 2])

  for (let n = 0; n < numExamples; ++n) {
    if (state[n] == null) {
      continue
    }
    // Mark the snake.
    state[n].s.forEach((yx, i) => {
      b.set(i === 0 ? 2 : 1, n, yx[0], yx[1], 0)
    })
    // Mark the fruit(s).
    state[n].f.forEach((yx) => {
      b.set(1, n, yx[0], yx[1], 1)
    })
  }
  return b.toTensor()
}

export function copyWeights(destNetwork: LayersModel, srcNetwork: LayersModel) {
  let originalDestNetworkTrainable
  if (destNetwork.trainable !== srcNetwork.trainable) {
    originalDestNetworkTrainable = destNetwork.trainable
    destNetwork.trainable = srcNetwork.trainable
  }

  destNetwork.setWeights(srcNetwork.getWeights())

  if (originalDestNetworkTrainable != null) {
    destNetwork.trainable = originalDestNetworkTrainable
  }
}
