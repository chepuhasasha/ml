import { defineStore } from 'pinia'

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

export const useSnakeGameEnv = defineStore('snake', {
  state: () => {
    return {
      game: {
        width: 9 as number,
        height: 9 as number
      },
      food: [] as Point[],
      snake: {
        dir: 0 as Directions,
        body: [] as Point[]
      },
      score: 0 as number
    }
  },
  actions: {
    initFood(n: number) {
      const food = Array(n).fill({ x: 0, y: 0 })
      this.food = [...food].map((f) => {
        return {
          x: Math.floor(Math.random() * this.game.width),
          y: Math.floor(Math.random() * this.game.height)
        }
      })
    },
    initSnake(n: number) {
      const vertical = Math.random() > 0.5 ? true : false
      const head = {
        x: vertical
          ? Math.floor(Math.random() * this.game.width)
          : Math.floor(Math.random() * (this.game.width - n - 1)) + 1,
        y: vertical
          ? Math.floor(Math.random() * (this.game.height - n - 1)) + 1
          : Math.floor(Math.random() * this.game.height)
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
    step(action: Action) {
      let reward = -0.2
      let is_eat = false
      let is_done = false
      const head: Point = {
        ...this.snake.body[0]
      }
      const die = () => {
        reward -= 100
        is_done = true
        console.log('DIE')
      }
      const eat = () => {
        reward += 100
        is_eat = true
        console.log('EAT!')
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
          if (head.y >= this.game.height) {
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
          if (head.x >= this.game.width) {
            die()
          }
        }
      }
      const forward = () => {
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

      forward()

      this.food.forEach((f, i) => {
        if (f.x === head.x && f.y === head.y) {
          eat()
          this.food[i].x = Math.floor(Math.random() * this.game.width)
          this.food[i].y = Math.floor(Math.random() * this.game.height)
        }
      })
      this.snake.body.forEach((p) => {
        if (p.x === head.x && p.y === head.y) {
          die()
        }
      })
      if (!is_eat) {
        this.snake.body.pop()
      }
      this.snake.body.unshift({ ...head })
      this.score += reward

      return {
        reward,
        is_done
      }
    },
    reset() {
      this.score = 0
      this.initFood(2)
      this.initSnake(4)
    }
  }
})
