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
  Game.snake_game(:cell='40' :game='game')
</template>
<script lang="ts" setup>
import Game from './Game.vue'
import { reactive } from 'vue'
import { SnakeGame } from './game'

const state = reactive({
  load: {
    model: false
  },
  url: 'https://storage.googleapis.com/tfjs-examples/snake-dqn/dqn/model.json',
  play: false,
  hasModel: false
})
const game = new SnakeGame(9, 9, 1, 2)
game.interval = 200
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
    button
      padding: 10px
</style>
