import { createApp } from 'vue'
import App from './App.vue'

export interface ClientOptions {
  height: number
  width: number
  foodLen: number
  snakeLen: number,
  cellSize: number
}

export const init = (
  selector: string = '#app',
  options: ClientOptions
) => {
  const app = createApp(App).provide('options', options).mount(selector)
}

if(import.meta.env.DEV) {
  // @ts-ignore
  window.SNAKE_CLIENT = {
    init
  }
}