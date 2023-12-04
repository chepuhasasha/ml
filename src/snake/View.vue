<template lang="pug">
.snake
  .snake_info
    h1 Snake
    p
      |This page loads a trained Deep Q-Network (DQN) and use it to play the
      |snake game.
      |The training is done in Node.js using tfjs-node.
    p
      |A DQN is trained to estimate the value of actions given the current game state.
      |The DQN is a 2D convolutional network.
      |The epsilon-greedy algorithm is used to balance exploration and exploitation during training.
    .snake_tools
      label MODEL URL:
      input(v-model='state.url')
      button(v-if='state.url' @click='loadModel') {{ state.load.model ? "Loading..." : "Load"  }}
      button(v-if='state.hasModel' @click='play') {{ state.play ? "STOP" : "PLAY"  }}
      input(type='range' v-model='state.speed' :min='10' :max='200')
  Game.snake_game(:cell='40' :game='game')
  button(@click='trainAgent') TRAIN
</template>
<script lang="ts" setup>
import Game from './Game.vue'
import { reactive, watch } from 'vue'
import { SnakeGame } from './game'
import { SnakeGameAgent } from './agent'
import { train } from './train'
const state = reactive({
  load: {
    model: false
  },
  url: 'https://storage.googleapis.com/tfjs-examples/snake-dqn/dqn/model.json',
  play: false,
  hasModel: false,
  speed: 100
})
const game = new SnakeGame(9, 9, 1, 2)
watch(
  () => state.speed,
  (n, o) => {
    play()
    game.interval = +n
    play()
  }
)
const args = {
  gpu: false,
  height: 9,
  width: 9,
  numFruits: 1,
  initLen: 2,
  cumulativeRewardThreshold: 100,
  maxNumFrames: 10000,
  replayBufferSize: 1000,
  epsilonInit: 0.5,
  epsilonFinal: 0.01,
  epsilonDecayFrames: 10000,
  batchSize: 64,
  gamma: 0.99,
  learningRate: 0.001,
  syncEveryFrames: 100,
  savePath: 'indexeddb://snake-model-dqn',
  logDir: null
}
const agent = new SnakeGameAgent(
  game,
  args.replayBufferSize,
  args.epsilonInit,
  args.epsilonFinal,
  args.epsilonDecayFrames,
  args.learningRate
)
const loadModel = () => {
  state.load.model = true
  game
    .loadModel(state.url)
    .finally(() => (state.load.model = false))
    .then(() => (state.hasModel = true))
}
const play = () => {
  state.play = !state.play
  game.autoPlay()
}

const trainAgent = () => {
  train(
    agent,
    args.batchSize,
    args.gamma,
    args.learningRate,
    args.syncEveryFrames,
    args.cumulativeRewardThreshold,
    args.maxNumFrames,
    args.savePath
  )
}
</script>
<style lang="sass">
.snake
  display: grid
  grid-template-columns: 1fr max-content
  flex-direction: column
  gap: 20px
  &_game
    grid-area: 1/2/2/3
  &_info
    grid-area: 1/1/2/2
    display: flex
    flex-direction: column
    gap: 20px
  &_tools
    display: flex
    flex-direction: column
    gap: 5px
</style>
