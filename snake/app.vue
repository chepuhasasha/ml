<template lang="pug">
main
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
import { reactive, watch } from 'vue'
import { SnakeGame } from '@/common'
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
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap')
*
  margin: 0
  box-sizing: border-box
  font-family: 'IBM Plex Mono', monospace
  color: black
label, span
  text-transform: uppercase
  font-size: 10px
  font-weight: 500
button
  cursor: pointer
  border-radius: 0
  border: none
  padding: 10px
  background: white
  color: black
  border: 1px solid black
  box-shadow: 0px 8px 0px -4px black
  &:hover
    background: black
    color: white
    border-color: white
input
  padding: 10px
input[type="range"]
  padding: 0px
  -webkit-appearance: none
  appearance: none
  background: transparent
  border: 1px solid black
  cursor: pointer
  width: 15rem
  &::-webkit-slider-runnable-track
    height: 20px
  &::-webkit-slider-thumb
    -webkit-appearance: none
    appearance: none
    background-color: black
    height: 20px
    width: 20px

main
  width: 100vw
  height: 100vh

.snake
  display: grid
  grid-template-columns: 1fr max-content
  flex-direction: column
  gap: 20px
  max-width: 1200px
  padding: 40px
  margin: 0 auto

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
