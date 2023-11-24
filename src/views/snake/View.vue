<template lang="pug">
.snake
  h1 Snake
  Game
</template>
<script lang="ts" setup>
import Game from './components/Game.vue'
</script>
<style lang="sass">
.snake
  display: flex
  flex-direction: column
  gap: 40px
</style>
