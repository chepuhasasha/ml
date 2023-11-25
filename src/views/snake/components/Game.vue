<template lang="pug">
.snake_game 
  .snake_game_controls
    label MODEL URL
    input(v-model='state.modelUrl')
    button(@click='loadModel') load model
    button(@click='autoPlay') {{ state.autoPlay ? "stop" : "play" }}
    button(@click='reset') reset
    label width: {{ state.width }}
    input(type='range' v-model='state.width' min='9' max='30') 
    label height: {{ state.height }}
    input(type='range' v-model='state.height' min='9' max='30') 
    label food: {{ state.foodLen }}
    input(type='range' v-model='state.foodLen' min='1' max='10') 
    label snake: {{ state.snakeLen }}
    input(type='range' v-model='state.snakeLen' min='2' max='5') 
  .snake_game_view
    .snake_game_view_score 
      span score
      | {{ state.score.toFixed(2)  }}
    canvas(ref='cvs')
    .snake_game_row
      button(@click='step(Action.LEFT)') ←
      button(@click='step(Action.FORWARD)') ↑
      button(@click='step(Action.RIGHT)') →
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { SnakeGame, Action } from '../game'
import { loadLayersModel, tidy, type LayersModel } from '@tensorflow/tfjs'
import { getStateTensor } from '../utils'

const cvs = ref<HTMLCanvasElement | null>(null)
const state = reactive({
  height: 9,
  width: 9,
  foodLen: 1,
  snakeLen: 2,
  score: 0,
  modelUrl: 'https://storage.googleapis.com/tfjs-examples/snake-dqn/dqn/model.json',
  autoPlay: false
})
const game = new SnakeGame(state.height, state.width, state.foodLen, state.snakeLen)
let qNet: null | LayersModel = null
let autoPlayIntervalJob: null | number = null

const step = (action: Action) => {
  const { done, reward } = game.step(action)
  state.score += reward
  if (done) {
    reset()
  } else {
    render()
  }
}

const render = () => {
  if (cvs.value) {
    cvs.value.width = game.width * 20
    cvs.value.height = game.height * 20
    const ctx = cvs.value.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cvs.value.width, cvs.value.height)

    let x = 0
    let y = 0
    game.food.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x * 20 + 10, point.y * 20 + 10, 5, 0, 2 * Math.PI, false)
      ctx.fillStyle = 'red'
      ctx.fill()
      ctx.closePath()
    })
    game.snake.forEach((point, i) => {
      if (i === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(point.x * 20 + 1, point.y * 20 + 1, 18, 18)
      } else {
        ctx.fillStyle = 'black'
        ctx.fillRect(point.x * 20 + 1, point.y * 20 + 1, 18, 18)
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
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'
      ctx.strokeRect(x * 20, (y - 1) * 20, 20, 20)
    }
  }
}

const reset = () => {
  state.score = 0
  game.reset()
  if (state.autoPlay) {
    autoPlay()
  }
  render()
}

const loadModel = async () => {
  try {
    qNet = await loadLayersModel(state.modelUrl)
    qNet.predict(getStateTensor(game.getState(), game.height, game.width));
    reset()
    console.log('Model loaded.')
  } catch (err) {
    console.log('Failed to load model.')
  }
}
const autoPlay = () => {
  if (state.autoPlay) {
    if (autoPlayIntervalJob) {
      clearInterval(autoPlayIntervalJob)
    }
  } else {
    autoPlayIntervalJob = setInterval(() => {
      const action = predictAction()
      if (action != null) {
        step(action)
      }
    }, 200)
  }
  state.autoPlay = !state.autoPlay
}

const predictAction = () => {
  let bestAction: null | number = null
  tidy(() => {
    if (qNet === null) return
    const stateTensor = getStateTensor(game.getState(), game.height, game.width)
    const predictOut = qNet.predict(stateTensor)
    if (Array.isArray(predictOut)) {
      bestAction = game.all_actions[predictOut[0].argMax(-1).dataSync()[0]]
    } else {
      bestAction = game.all_actions[predictOut.argMax(-1).dataSync()[0]]
    }
  })
  return bestAction
}

watch(
  () => {
    return {
      width: state.width,
      height: state.height,
      foodLen: state.foodLen,
      snakeLen: state.snakeLen
    }
  },
  (n, o) => {
    game.height = +n.height
    game.width = +n.width
    game.foodLen = +n.foodLen
    game.snakeLen = +n.snakeLen
    reset()
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
.snake_game
  display: flex
  gap: 20px
  &_view
    display: flex
    flex-direction: column
    height: max-content
    width: max-content
    gap: 10px
    canvas
      border: 1px solid black
    &_score
      display: flex
      justify-content: space-between
      background: black
      padding: 4px
      font-weight: 600
      color: white
      span
        color: rgba(255,255,255, 0.7)
  &_row
    display: flex
    gap: 10px
    // button
      // width: 100%
      // font-size: 26px
  &_controls
    display: flex
    flex-direction: column
    gap: 10px
</style>
