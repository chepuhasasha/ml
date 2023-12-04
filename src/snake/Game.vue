<template lang="pug">
.snake_game
  .snake_game_score 
    span score
    | {{ score.toFixed(2)  }}
  canvas(ref='cvs')
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref, type PropType, watch } from 'vue'
import { SnakeGame, Action } from './game'

const cvs = ref<HTMLCanvasElement | null>(null)
const props = defineProps({
  cell: { type: Number as PropType<number>, default: 20 },
  game: { type: Object as PropType<SnakeGame | null>, default: null }
})

const score = ref(0)

const render = () => {
  if (cvs.value && props.game) {
    cvs.value.width = props.game.width * props.cell
    cvs.value.height = props.game.height * props.cell
    const ctx = cvs.value.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cvs.value.width, cvs.value.height)
    
    let x = 0
    let y = 0
    props.game.food.forEach((point) => {
      ctx.beginPath()
      ctx.arc(
        point.x * props.cell + props.cell / 2,
        point.y * props.cell + props.cell / 2,
        props.cell / 4,
        0,
        2 * Math.PI,
        false
      )
      ctx.fillStyle = 'red'
      ctx.fill()
      ctx.closePath()
    })
    props.game.snake.forEach((point, i) => {
      if (i === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(
          point.x * props.cell + 2,
          point.y * props.cell + 2,
          props.cell - 4,
          props.cell - 4
        )
      } else {
        ctx.fillStyle = 'black'
        ctx.fillRect(
          point.x * props.cell + 2,
          point.y * props.cell + 2,
          props.cell - 4,
          props.cell - 4
        )
      }
    })
    for (let i = 0; i < props.game.width * props.game.height; i++) {
      const row = i % props.game.width
      if (row === 0) {
        y += 1
        x = 0
      } else {
        x += 1
      }
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.strokeRect(x * props.cell, (y - 1) * props.cell, props.cell, props.cell)
    }
  }
}
const reset = () => {
  if (props.game) {
    score.value = 0
    props.game.reset()
    render()
  }
}
const step = (action: Action) => {
  if (props.game) {
    props.game.step(action)
  }
}
if (props.game) {
  props.game.onStep((data) => {
    score.value += data.reward
    if (data.done) {
      reset()
    } else {
      render()
    }
  })
}

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
