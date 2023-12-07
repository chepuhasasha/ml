export enum Action {
  FORWARD = 0,
  RIGHT = 1,
  LEFT = 2,
}
export enum Reward {
  DIE = -10,
  EAT = 10,
  NOT_EAT = -0.2,
}
export enum Directions {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

export type Point = {
  x: number;
  y: number;
};

export interface State {
  f: [number, number][];
  s: [number, number][];
}

export interface StepResult {
  state: State;
  reward: number;
  done: boolean;
  fruitEaten: boolean;
}

export class SnakeGame {
  public food: Point[] = [];
  public snake: Point[] = [];
  snake_dir: Directions = Directions.UP;
  readonly actions = [Action.FORWARD, Action.RIGHT, Action.LEFT];

  public listeners: ((data: StepResult) => void)[] = [];

  constructor(
    public height: number,
    public width: number,
    public foodLen: number,
    public snakeLen: number
  ) {
    this.reset();
  }

  private makeFood(n: number, food: Point[], snake: Point[]) {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        grid.push({ y, x });
      }
    }

    let empty = grid.filter((g) => {
      return (
        !food.find((f) => f.x === g.x && f.y === g.y) &&
        !snake.find((s) => s.x === g.x && s.y === g.y)
      );
    });

    for (let f = 0; f < n; f++) {
      if (n - f <= empty.length) {
        const randomIndex = Math.floor(Math.random() * empty.length);
        food.push(empty[randomIndex]);
        empty.splice(randomIndex, 1);
      }
    }
    return food;
  }
  private initSnake(n: number) {
    const vertical = Math.random() > 0.5 ? true : false;
    const head = {
      x: vertical
        ? Math.floor(Math.random() * (this.width - 1))
        : Math.floor(Math.random() * (this.width - 1 - n)),
      y: vertical
        ? Math.floor(Math.random() * (this.height - 1 - n))
        : Math.floor(Math.random() * (this.height - 1)),
    };
    this.snake = [...Array(n).fill({ x: 0, y: 0 })].map((p, i) => {
      return {
        x: vertical ? head.x : head.x + i,
        y: vertical ? head.y + i : head.y,
      };
    });
    this.snake_dir = vertical ? Directions.UP : Directions.LEFT;
  }
  public reset() {
    this.initSnake(this.snakeLen);
    this.food = this.makeFood(this.foodLen, this.food, this.snake);
  }
  public getState(): State {
    return {
      f: this.food.map((p) => [p.x, p.y]),
      s: this.snake.map((p) => [p.x, p.y]),
    };
  }
  public randomAction() {
    return Math.floor(this.actions.length * Math.random());
  }
  public step(action: Action, just_check: boolean = false) {
    let reward = Reward.NOT_EAT;
    let fruitEaten = false;
    let done = false;
    const head: Point = {
      x: this.snake[0].x,
      y: this.snake[0].y,
    };
    const snake = [...this.snake];
    let food = [...this.food];
    let dir = this.snake_dir;

    const result = {
      state: {
        f: food.map((p) => [p.x, p.y]),
        s: snake.map((p) => [p.x, p.y]),
      } as State,
      reward,
      done,
      fruitEaten,
    };
    this.listeners.forEach((cb) => {
      cb(result);
    });
    const getResult = () => {
      const result = {
        state: {
          f: food.map((p) => [p.x, p.y]),
          s: snake.map((p) => [p.x, p.y]),
        } as State,
        reward,
        done,
        fruitEaten,
      };
      this.listeners.forEach((cb) => {
        cb(result);
      });
      return result;
    };

    // change direction
    if (action === Action.LEFT) {
      if (dir === Directions.UP) {
        dir = Directions.LEFT;
      } else if (dir === Directions.LEFT) {
        dir = Directions.DOWN;
      } else if (dir === Directions.DOWN) {
        dir = Directions.RIGHT;
      } else if (dir === Directions.RIGHT) {
        dir = Directions.UP;
      }
    } else if (action === Action.RIGHT) {
      if (dir === Directions.UP) {
        dir = Directions.RIGHT;
      } else if (dir === Directions.RIGHT) {
        dir = Directions.DOWN;
      } else if (dir === Directions.DOWN) {
        dir = Directions.LEFT;
      } else if (dir === Directions.LEFT) {
        dir = Directions.UP;
      }
    }
    // move
    if (dir === Directions.UP) {
      head.y -= 1;
    } else if (dir === Directions.DOWN) {
      head.y += 1;
    } else if (dir === Directions.LEFT) {
      head.x -= 1;
    } else if (dir === Directions.RIGHT) {
      head.x += 1;
    }
    // Left the field?
    if (
      head.y === -1 ||
      head.y > this.height - 1 ||
      head.x === -1 ||
      head.x > this.width - 1
    ) {
      reward = Reward.DIE;
      done = true;
      return getResult();
    }

    // Did the snake bite itself?
    snake.forEach((s, i) => {
      if (s.x === head.x && s.y === head.y) {
        reward = Reward.DIE;
        done = true;
        return getResult();
      }
    });

    // change body
    const lastSnakeBlock = snake.pop() as Point;
    snake.unshift({ ...head });

    // Did the snake eat?
    food.forEach((f) => {
      if (f.x === head.x && f.y === head.y) {
        reward = Reward.EAT;
        fruitEaten = true;
        snake.push(lastSnakeBlock);
        food = this.makeFood(1, food, snake);
      }
    });

    if (!just_check) {
      this.snake = snake;
      this.food = food;
      this.snake_dir = dir;
    }

    return getResult();
  }
  public onStep(cb: (data: StepResult) => void) {
    this.listeners.push(cb);
  }
  public getRenderString() {
    const result = Array(this.height).fill(" ".repeat(this.width));
    return result
      .map((row, i) => {
        let updatedRow = row;
        this.food
          .filter((f) => f.y === i)
          .forEach((f) => {
            updatedRow =
              updatedRow.substr(0, f.x) + "." + updatedRow.substr(f.x + 1);
          });
        this.snake
          .filter((s) => s.y === i)
          .forEach((s) => {
            updatedRow =
              updatedRow.substr(0, s.x) + "▊" + updatedRow.substr(s.x + 1);
          });
        return updatedRow;
      })
      .reduce((acc, row) => {
        acc += `|${row}|\n`;
        return acc;
      }, "");
  }
}


