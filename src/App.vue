<template lang="pug">
main
  nav
    RouterLink(to="/") Home
    RouterLink(to="/snake") Snake
  .page
    RouterView
</template>
<script lang="ts" setup>

</script>
<style lang="sass">
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap')
*
  margin: 0
  box-sizing: border-box
  font-family: 'IBM Plex Mono', monospace
  color: black
main
  display: grid
  grid-template-columns: 1fr
  grid-template-rows: max-content 1fr
  width: 1200px
  max-width: 100vw
  height: 100vh
  margin: 0 auto
  padding: 40px
  gap: 40px

  nav
    display: flex
    // padding: 20px
    gap: 20px
.page
  overflow: auto
  height: 100%
  width: 100%
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
</style>