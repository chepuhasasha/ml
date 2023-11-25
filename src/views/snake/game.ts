import { defineStore } from 'pinia'
import { buffer } from '@tensorflow/tfjs'

export enum Cell {
  VOID = 0,
  SNAKE = 1,
  FOOD = 2
}
export enum Action {
  FORWARD = 0,
  LEFT = 1,
  RIGHT = 2
}
export enum Directions {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3
}

export type Point = {
  x: number
  y: number
}

export interface State {
  f: [number, number][]
  s: [number, number][]
}

export const useSnakeGameEnv = defineStore('snake', {
  state: () => {
    return {
      width: 9 as number,
      height: 9 as number,
      food: [] as Point[],
      snake: {
        dir: 0 as Directions,
        body: [] as Point[]
      },
      score: 0 as number,
      nam_actions: 3 as number,
      all_actions: [Action.FORWARD, Action.LEFT, Action.RIGHT]
    }
  },
  actions: {
    initFood(n: number) {
      const food = Array(n).fill({ x: 0, y: 0 })
      this.food = [...food].map((f) => {
        return {
          x: Math.floor(Math.random() * this.width),
          y: Math.floor(Math.random() * this.height)
        }
      })
    },
    initSnake(n: number) {
      const vertical = Math.random() > 0.5 ? true : false
      const head = {
        x: vertical
          ? Math.floor(Math.random() * this.width)
          : Math.floor(Math.random() * (this.width - n - 1)) + 1,
        y: vertical
          ? Math.floor(Math.random() * (this.height - n - 1)) + 1
          : Math.floor(Math.random() * this.height)
      }
      const snake = Array(n).fill({ x: 0, y: 0 })
      this.snake.body = [...snake].map((p, i) => {
        return {
          x: vertical ? head.x : head.x + i,
          y: vertical ? head.y + i : head.y
        }
      })
      this.snake.dir = vertical ? Directions.UP : Directions.LEFT
    },
    step(action: Action, is_check_step: boolean = false) {
      let reward = -0.2
      let fruitEaten = false
      let done = false
      const head: Point = {
        ...this.snake.body[0]
      }
      const die = () => {
        reward -= 10
        done = true
      }
      const move = {
        up: () => {
          head.y -= 1
          if (head.y === -1) {
            die()
          }
        },
        down: () => {
          head.y += 1
          if (head.y >= this.height) {
            die()
          }
        },
        left: () => {
          head.x -= 1
          if (head.x === -1) {
            die()
          }
        },
        right: () => {
          head.x += 1
          if (head.x >= this.width) {
            die()
          }
        }
      }
      const go = () => {
        if (this.snake.dir === Directions.UP) {
          move.up()
        } else if (this.snake.dir === Directions.DOWN) {
          move.down()
        } else if (this.snake.dir === Directions.LEFT) {
          move.left()
        } else if (this.snake.dir === Directions.RIGHT) {
          move.right()
        }
      }

      if (action === Action.LEFT) {
        if (this.snake.dir === Directions.UP) {
          this.snake.dir = Directions.LEFT
        } else if (this.snake.dir === Directions.LEFT) {
          this.snake.dir = Directions.DOWN
        } else if (this.snake.dir === Directions.DOWN) {
          this.snake.dir = Directions.RIGHT
        } else if (this.snake.dir === Directions.RIGHT) {
          this.snake.dir = Directions.UP
        }
      } else if (action === Action.RIGHT) {
        if (this.snake.dir === Directions.UP) {
          this.snake.dir = Directions.RIGHT
        } else if (this.snake.dir === Directions.RIGHT) {
          this.snake.dir = Directions.DOWN
        } else if (this.snake.dir === Directions.DOWN) {
          this.snake.dir = Directions.LEFT
        } else if (this.snake.dir === Directions.LEFT) {
          this.snake.dir = Directions.UP
        }
      }

      go()

      const targetSnake = !is_check_step ? this.snake.body : [...this.snake.body]
      const targetFood = !is_check_step ? this.food : [...this.food]

      targetFood.forEach((f, i) => {
        if (f.x === head.x && f.y === head.y) {
          reward += 10 + 0.2
          fruitEaten = true
          targetFood[i].x = Math.floor(Math.random() * this.width)
          targetFood[i].y = Math.floor(Math.random() * this.height)
        }
      })
      targetSnake.forEach((p) => {
        if (p.x === head.x && p.y === head.y) {
          die()
        }
      })

      if (!fruitEaten) {
        targetSnake.pop()
      }
      targetSnake.unshift({ ...head })

      if (!is_check_step) {
        this.score += reward
      }

      return {
        state: {
          f: targetFood.map((p) => [p.x, p.y]),
          s: targetSnake.map((p) => [p.x, p.y])
        } as State,
        reward,
        done,
        fruitEaten
      }
    },
    reset() {
      this.score = 0
      this.initFood(1)
      this.initSnake(2)
    },
    randomAction() {
      return Math.floor(this.nam_actions * Math.random())
    },
    getState(): State {
      return {
        f: this.food.map((p) => [p.x, p.y]),
        s: this.snake.body.map((p) => [p.x, p.y])
      }
    }
  }
})
