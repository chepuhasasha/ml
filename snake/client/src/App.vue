<template lang="pug">
.snake
  //- button(@click='train') TRAIN
  .snake_game
    .snake_game_score 
      span state.score
      | {{ state.score.toFixed(2)  }}
    canvas(ref='cvs')
  .snake_tools(v-if='!state.hasModel')
    label MODEL URL:
    input(v-model='state.url')
    button(v-if='state.url' @click='loadModel') {{ state.load.model ? "Loading..." : "MAKE AGENT"  }}
  .snake_tools(v-else)
    label SPEED: step in {{ state.speed }} ms.
    input(type='range' v-model='state.speed' :min='10' :max='200')
    button(@click='play') {{ state.play ? "STOP" : "PLAY"  }}
    button(@click='kill') KILL

</template>
<script lang="ts" setup>
import { ref, inject, onMounted, onUnmounted, reactive, watch } from 'vue'
import { Action, SnakeGame } from './game'
import { Player } from './player'
import type { ClientOptions } from './main'
// import { io } from 'socket.io-client'

// const config = {
//   game: {
//     height: 9,
//     width: 9,
//     food: 1,
//     snake: 2
//   },
//   epsilon: {
//     init: 0.5,
//     final: 0.01,
//     decay_frames: 1e5
//   },
//   gamma: 0.99,
//   learning_rate: 1e-3,
//   replay_buffer_size: 1e4,
//   batch_size: 64,
//   thresholds: {
//     cumulative_reward: 500,
//     max_frames: 1e6
//   },
//   sync_every_frames: 1e3,
//   version: 1
// }

// const socket = io('localhost:3000', {
//   withCredentials: true
// })

// socket.on('state', (data) => {
//   console.log(data)
// })

// const train = () => {
//   socket.emit('train', config)
// }

const options = inject<ClientOptions>('options') as ClientOptions
const cvs = ref<HTMLCanvasElement | null>(null)

const game = new SnakeGame(options.height, options.height, options.foodLen, options.snakeLen)
const player = new Player(game)

game.onStep((data) => {
  state.score += data.reward
  if (data.done) {
    reset()
  } else {
    render()
  }
})

const state = reactive({
  load: {
    model: false
  },
  url: 'https://storage.googleapis.com/tfjs-examples/snake-dqn/dqn/model.json',
  play: false,
  hasModel: false,
  speed: 40,
  score: 0
})

const render = () => {
  if (cvs.value && game) {
    cvs.value.width = game.width * options.cellSize
    cvs.value.height = game.height * options.cellSize
    const ctx = cvs.value.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cvs.value.width, cvs.value.height)

    let x = 0
    let y = 0
    game.food.forEach((point) => {
      ctx.beginPath()
      ctx.arc(
        point.x * options.cellSize + options.cellSize / 2,
        point.y * options.cellSize + options.cellSize / 2,
        options.cellSize / 4,
        0,
        2 * Math.PI,
        false
      )
      ctx.fillStyle = 'red'
      ctx.fill()
      ctx.closePath()
    })
    game.snake.forEach((point, i) => {
      if (i === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillRect(
          point.x * options.cellSize + 4,
          point.y * options.cellSize + 4,
          options.cellSize - 8,
          options.cellSize - 8
        )
      } else {
        ctx.fillStyle = 'white'
        ctx.fillRect(
          point.x * options.cellSize + 4,
          point.y * options.cellSize + 4,
          options.cellSize - 8,
          options.cellSize - 8
        )
      }
    })
    for (let i = 0; i < game.width * game.height; i++) {
      const row = i % game.width
      if (row === 0) {
        y += 1
        x = 0
      } else {
        x += 1
      }
      ctx.strokeStyle = 'rgba(255,255,255,1)'
      ctx.strokeRect(
        x * options.cellSize,
        (y - 1) * options.cellSize,
        options.cellSize,
        options.cellSize
      )
    }
  }
}
const reset = () => {
  if (game) {
    state.score = 0
    game.reset()
    render()
  }
}
const step = (action: Action) => {
  if (game) {
    game.step(action)
  }
}

const loadModel = async () => {
  state.load.model = true
  const model = await player.loadModel(state.url)
  if (model) {
    state.hasModel = true
    state.load.model = false
  } else {
    state.hasModel = false
    state.load.model = false
  }
}

const play = () => {
  state.play = !state.play
  player.speed = +state.speed
  player.playOrPause()
}

const kill = () => {
  state.play = false
  state.hasModel = false
  game.reset()
  render()
  player.reset()
}

watch(
  () => state.speed,
  (n, o) => {
    player.playOrPause()
    player.speed = +n
    player.playOrPause()
  }
)

const keydown = (e: KeyboardEvent) => {
  if (e.code === 'ArrowUp') {
    step(Action.FORWARD)
  } else if (e.code === 'ArrowLeft') {
    step(Action.LEFT)
  } else if (e.code === 'ArrowRight') {
    step(Action.RIGHT)
  }
}

onMounted(() => {
  window.addEventListener('keydown', keydown)
  reset()
})
onUnmounted(() => {
  window.removeEventListener('keydown', keydown)
})
</script>
<style lang="sass">
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap')

.snake
  display: flex
  flex-direction: column
  gap: 20px
  padding: 40px
  width: 100%
  height: 100%
  background: black
  *
    color: white
    font-family: 'IBM Plex Mono', monospace
  &_tools
    display: flex
    flex-direction: column
    gap: 10px
  &_game
    display: flex
    flex-direction: column
    height: max-content
    width: max-content
    gap: 10px
    canvas
      border: 1px solid white
    &_score
      display: flex
      justify-content: space-between
      background: white
      padding: 4px
      font-weight: 600
      color: black
      span
        color: rgba(255,255,255, 0.7)

  label, span
    text-transform: uppercase
    font-size: 10px
    font-weight: 500
  button
    cursor: pointer
    border-radius: 0
    border: none
    padding: 10px
    background: black
    color: white
    border: 1px solid white
    box-shadow: 0px 8px 0px -4px white
    &:hover
      background: white
      color: black
      border-color: black
  input
    padding: 10px
    color: black
  input[type="range"]
    padding: 0px
    -webkit-appearance: none
    appearance: none
    background: transparent
    border: 1px solid white
    cursor: pointer
    &::-webkit-slider-runnable-track
      height: 20px
    &::-webkit-slider-thumb
      -webkit-appearance: none
      appearance: none
      background-color: white
      height: 20px
      width: 20px
</style>
