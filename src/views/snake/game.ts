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

export class SnakeGame {
  readonly food: Point[] = []
  readonly snake: Point[] = []
  snake_dir: Directions = Directions.UP
  readonly num_actions = 3
  readonly all_actions = [Action.FORWARD, Action.LEFT, Action.RIGHT]

  constructor(
    public height: number,
    public width: number,
    public foodLen: number,
    public snakeLen: number
  ) {
    this.reset()
  }

  private initFood(n: number) {
    this.food = [...Array(n).fill({ x: 0, y: 0 })].map((f) => {
      return {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      }
    })
  }
  private initSnake(n: number) {
    const vertical = Math.random() > 0.5 ? true : false
    const head = {
      x: vertical
        ? Math.floor(Math.random() * this.width)
        : Math.floor(Math.random() * (this.width - n - 1)) + 1,
      y: vertical
        ? Math.floor(Math.random() * (this.height - n - 1)) + 1
        : Math.floor(Math.random() * this.height)
    }
    this.snake = [...Array(n).fill({ x: 0, y: 0 })].map((p, i) => {
      return {
        x: vertical ? head.x : head.x + i,
        y: vertical ? head.y + i : head.y
      }
    })
    this.snake_dir = vertical ? Directions.UP : Directions.LEFT
  }
  public reset() {
    this.initFood(this.foodLen)
    this.initSnake(this.snakeLen)
  }
  public getState(): State {
    return {
      f: this.food.map((p) => [p.x, p.y]),
      s: this.snake.map((p) => [p.x, p.y])
    }
  }
  public randomAction() {
    return Math.floor(this.num_actions * Math.random())
  }
  public step(action: Action, is_check_step: boolean = false) {
    let reward = -0.2
    let fruitEaten = false
    let done = false
    const head: Point = {
      ...this.snake[0]
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
      if (this.snake_dir === Directions.UP) {
        move.up()
      } else if (this.snake_dir === Directions.DOWN) {
        move.down()
      } else if (this.snake_dir === Directions.LEFT) {
        move.left()
      } else if (this.snake_dir === Directions.RIGHT) {
        move.right()
      }
    }

    if (action === Action.LEFT) {
      if (this.snake_dir === Directions.UP) {
        this.snake_dir = Directions.LEFT
      } else if (this.snake_dir === Directions.LEFT) {
        this.snake_dir = Directions.DOWN
      } else if (this.snake_dir === Directions.DOWN) {
        this.snake_dir = Directions.RIGHT
      } else if (this.snake_dir === Directions.RIGHT) {
        this.snake_dir = Directions.UP
      }
    } else if (action === Action.RIGHT) {
      if (this.snake_dir === Directions.UP) {
        this.snake_dir = Directions.RIGHT
      } else if (this.snake_dir === Directions.RIGHT) {
        this.snake_dir = Directions.DOWN
      } else if (this.snake_dir === Directions.DOWN) {
        this.snake_dir = Directions.LEFT
      } else if (this.snake_dir === Directions.LEFT) {
        this.snake_dir = Directions.UP
      }
    }

    go()

    const targetSnake = !is_check_step ? this.snake : [...this.snake]
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

    return {
      state: {
        f: targetFood.map((p) => [p.x, p.y]),
        s: targetSnake.map((p) => [p.x, p.y])
      } as State,
      reward,
      done,
      fruitEaten
    }
  }
}
