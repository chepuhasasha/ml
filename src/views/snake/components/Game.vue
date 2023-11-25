<template lang="pug">
.snake_game 
  .snake_game_controls
    button(@click='reset') reset
    label width: {{ env.width }}
    input(type='range' v-model='env.width' min='9' max='30') 
    label height: {{ env.height }}
    input(type='range' v-model='env.height' min='9' max='30') 
    .snake_game_actions
      button(@click='step(Action.LEFT)') ←
      button(@click='step(Action.FORWARD)') ↑
      button(@click='step(Action.RIGHT)') →
  .snake_game_view
    .snake_game_view_score 
      span score
      | {{ env.score.toFixed(2)  }}
    canvas(ref='cvs')
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useSnakeGameEnv, Action, Cell } from '../game'

const cvs = ref<HTMLCanvasElement | null>(null)
const env = useSnakeGameEnv()

const step = (action: Action) => {
  const { state, reward, done } = env.step(action)
  if (done) {
    reset()
  } else {
    render()
  }
}
const render = () => {
  if (cvs.value) {
    cvs.value.width = env.width * 20
    cvs.value.height = env.height * 20
    const ctx = cvs.value.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cvs.value.width, cvs.value.height)

    let x = 0
    let y = 0
    env.food.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x * 20 + 10, point.y * 20 + 10, 5, 0, 2 * Math.PI, false)
      ctx.fillStyle = 'red'
      ctx.fill()
      ctx.closePath()
    })
    env.snake.body.forEach((point, i) => {
      if (i === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(point.x * 20 + 1, point.y * 20 + 1, 18, 18)
      } else {
        ctx.fillStyle = 'black'
        ctx.fillRect(point.x * 20 + 1, point.y * 20 + 1, 18, 18)
      }
    })
    for (let i = 0; i < env.width * env.height; i++) {
      const row = i % env.width
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
  env.reset()
  render()
}

watch(
  () => {
    return {
      game: {
        width: env.width,
        height: env.height
      }
    }
  },
  () => {
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
  &_actions
    display: flex
    gap: 10px
    button
      width: 100%
      font-size: 26px
  &_controls
    display: flex
    flex-direction: column
    gap: 10px
</style>
