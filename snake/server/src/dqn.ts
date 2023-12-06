import { layers, sequential } from '@tensorflow/tfjs-node-gpu'

export const createDeepQNetwork = (h: number, w: number, numActions: number) => {
  const model = sequential()
  model.add(
    layers.conv2d({
      filters: 120,
      kernelSize: 3,
      strides: 1,
      activation: 'relu',
      inputShape: [h, w, 2]
    })
  )
  model.add(layers.batchNormalization())
  model.add(
    layers.conv2d({
      filters: 256,
      kernelSize: 3,
      strides: 1,
      activation: 'relu'
    })
  )
  model.add(layers.batchNormalization())
  model.add(
    layers.conv2d({
      filters: 256,
      kernelSize: 3,
      strides: 1,
      activation: 'relu'
    })
  )
  model.add(layers.flatten())
  model.add(layers.dense({ units: 100, activation: 'relu' }))
  model.add(layers.dropout({ rate: 0.25 }))
  model.add(layers.dense({ units: numActions }))
  return model
}
