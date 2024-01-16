export interface BoxGeometry {
  dx: number;
  dy: number;
  dz: number;
}
export interface Point {
  x: number;
  y: number;
  z: number;
}
export interface Rotate {
  rx: boolean;
  ry: boolean;
  rz: boolean;
}
export type WithId<T> = { id: string } & T;
export interface Options extends BoxGeometry {
  shape: {
    x: number;
    z: number;
  };
  boxes: {
    unplaced: { [id: string]: BoxGeometry };
    placed: { [id: string]: BoxGeometry & Rotate & Point };
  };
}
export interface State {
  r: [number, number, number][];
  s: [number, number, number][];
  n: [number, number, number][];
}
export enum ACTIONS {
  PUSH = 0,
  MINUS_X = 1,
  PLUS_X = 2,
  MINUS_Z = 3,
  PLUS_Z = 4,
  ROTATE_X = 5,
  ROTATE_Y = 6,
  ROTATE_Z = 7,
}
export enum REWARD {
  DIE = -10,
  PUSH = 10,
  MOVE = -0.2,
  ROTATE = -0.2,
}

export class Env implements Options {
  dx: number = 0;
  dy: number = 0;
  dz: number = 0;
  boxes: {
    unplaced: { [id: string]: BoxGeometry };
    placed: { [id: string]: BoxGeometry & Rotate & Point };
  } = {
    unplaced: {},
    placed: {},
  };
  shape: { x: number; z: number } = { x: 0, z: 0 };
  selected: WithId<BoxGeometry & Rotate & Point> | null = null;
  next: WithId<BoxGeometry & Rotate & Point> | null = null;

  relief: { [x_z: string]: { y: number; boxes: string[] } } = {};

  constructor(options: Options) {
    this.reset(options);
  }

  // TODO
  reset(options: Options) {
    this.dx = options.dx;
    this.dy = options.dy;
    this.dz = options.dz;
    this.shape = options.shape;
    this.boxes.placed = {};
    for (let id in options.boxes.placed) {
      this.place(id, options.boxes.placed[id]);
    }
    this.boxes.unplaced = options.boxes.unplaced;
    // this.select()
  }

  getState(): State {
    const state: State = {
      r: Object.keys(this.relief).map((key) => {
        const c = key.split("_");
        return [+c[0], this.relief[key].y, +c[1]];
      }),
      s: [],
      n: [],
    };
    if (this.selected != null) {
      this.cells(this.selected).forEach((cell) => {
        state.s.push([
          cell.x,
          this.slice(
            {
              x: cell.x * this.cell.dx,
              y: this.dy / 2,
              z: cell.z * this.cell.dz,
              dx: this.cell.dx,
              dy: this.dy,
              dz: this.cell.dz,
            },
            [this.selected as BoxGeometry & Point]
          ).height.average,
          cell.z,
        ]);
      });
    }
    if (this.next != null) {
      this.cells(this.next).forEach((cell) => {
        state.n.push([
          cell.x,
          this.slice(
            {
              x: cell.x * this.cell.dx,
              y: this.dy / 2,
              z: cell.z * this.cell.dz,
              dx: this.cell.dx,
              dy: this.dy,
              dz: this.cell.dz,
            },
            [this.next as BoxGeometry & Point]
          ).height.average,
          cell.z,
        ]);
      });
    }
    return state;
  }

  step(action: ACTIONS) {
    switch (action) {
      case ACTIONS.PUSH:
        return this.push();
      case ACTIONS.MINUS_X:
        return this.move("x", -1);
      case ACTIONS.MINUS_Z:
        return this.move("z", -1);
      case ACTIONS.PLUS_X:
        return this.move("x", 1);
      case ACTIONS.PLUS_Z:
        return this.move("z", 1);
      case ACTIONS.ROTATE_X:
        return this.rotate("x");
      case ACTIONS.ROTATE_Y:
        return this.rotate("y");
      case ACTIONS.ROTATE_Z:
        return this.rotate("z");
      default:
        break;
    }
    return null;
  }

  private push() {
    let done = false;
    let reward = 0;
    if (this.selected) {
      const { volume, height } = this.slice(
        {
          x: this.selected.x,
          y: this.dy / 2,
          z: this.selected.z,
          dx: this.selected.dx,
          dy: this.dy,
          dz: this.selected.dz,
        },
        Object.values(this.boxes.placed)
      );
      this.selected.y = height.max + this.selected.dy / 2;
      if (this.selected.y + this.selected.dy / 2 > this.dy) {
        reward = REWARD.DIE;
        done = true;
      } else {
        reward =
          ((this.selected.dx * height.max * this.selected.dz) / REWARD.PUSH) *
          (this.selected.dx * height.max * this.selected.dz - volume);
      }
      this.place(this.selected.id, this.selected);
      this.select();
    }
    return {
      state: this.getState(),
      reward: reward as number,
      done,
    };
  }

  private move(axis: "x" | "z", step: -1 | 1) {
    let done = false;
    let reward = REWARD.MOVE;
    if (this.selected) {
      if (axis === "x") {
        this.selected.x += step;
        if (
          this.selected.x - this.selected.dx / 2 < 0 ||
          this.selected.x + this.selected.dx / 2 > this.dx
        ) {
          done = true;
          reward = REWARD.DIE;
        }
      } else if (axis === "z") {
        this.selected.z += step;
        if (
          this.selected.z - this.selected.dz / 2 < 0 ||
          this.selected.z + this.selected.dz / 2 > this.dz
        ) {
          done = true;
          reward = REWARD.DIE;
        }
      }
    }
    return {
      state: this.getState(),
      reward: reward as number,
      done,
    };
  }

  private rotate(axis: "x" | "y" | "z") {
    let done = false;
    let reward = REWARD.ROTATE;
    if (this.selected) {
      if (axis === "x") {
        this.selected.rx = !this.selected.rx;
        const dx = this.selected.dx;
        const dy = this.selected.dy;
        this.selected.dx = dy;
        this.selected.dy = dx;
      } else if (axis === "y") {
        this.selected.ry = !this.selected.ry;
        const dx = this.selected.dx;
        const dz = this.selected.dz;
        this.selected.dx = dz;
        this.selected.dz = dx;
      } else if (axis === "z") {
        this.selected.rz = !this.selected.rz;
        const dz = this.selected.dz;
        const dy = this.selected.dy;
        this.selected.dz = dy;
        this.selected.dy = dz;
      }
      if (
        this.selected.x - this.selected.dx / 2 < 0 ||
        this.selected.x + this.selected.dx / 2 > this.dx ||
        this.selected.z - this.selected.dz / 2 < 0 ||
        this.selected.z + this.selected.dz / 2 > this.dz
      ) {
        reward = REWARD.DIE;
        done = true;
      }
    }
    return {
      state: this.getState(),
      reward: reward as number,
      done,
    };
  }

  private select() {
    if (this.next === null) {
      this.selected = null;
      return;
    }
    this.selected = {
      ...this.next,
    };
    const unplaced = Object.keys(this.boxes.unplaced);
    if (unplaced.length > 0) {
      const box = {
        id: unplaced[0],
        ...this.boxes.unplaced[unplaced[0]],
      };
      this.next = {
        ...box,
        x: this.dx / 2,
        y: box.dy / 2,
        z: this.dz / 2,
        rx: false,
        ry: false,
        rz: false,
      };
      delete this.boxes.unplaced[box.id];
    } else {
      this.next = null;
    }
  }

  private intersection(
    a: BoxGeometry & Point,
    b: BoxGeometry & Point
  ): (BoxGeometry & Point) | null {
    const xMin = Math.max(a.x - a.dx / 2, b.x - b.dx / 2);
    const xMax = Math.min(a.x + a.dx / 2, b.x + b.dx / 2);

    const yMin = Math.max(a.y - a.dy / 2, b.y - b.dy / 2);
    const yMax = Math.min(a.y + a.dy / 2, b.y + b.dy / 2);

    const zMin = Math.max(a.z - a.dz / 2, b.z - b.dz / 2);
    const zMax = Math.min(a.z + a.dz / 2, b.z + b.dz / 2);

    if (xMin <= xMax && yMin <= yMax && zMin <= zMax) {
      const d = {
        dx: xMax - xMin,
        dy: yMax - yMin,
        dz: zMax - zMin,
      };
      return {
        x: xMin + d.dx / 2,
        y: yMin + d.dy / 2,
        z: zMin + d.dz / 2,
        dx: d.dx,
        dy: d.dy,
        dz: d.dz,
      };
    }

    return null;
  }

  // неучитывать выходы за края
  private cells(box: BoxGeometry & Rotate & Point) {
    const area = {
      x: Math.floor((box.x - box.dx / 2) / this.cell.dx),
      z: Math.floor((box.z - box.dz / 2) / this.cell.dz),
      _x: Math.ceil((box.x + box.dx / 2) / this.cell.dx),
      _z: Math.ceil((box.z + box.dz / 2) / this.cell.dz),
    };
    const cells: { x: number; z: number }[] = [];
    for (let x = area.x; x < area._x; x++) {
      for (let z = area.z; z < area._z; z++) {
        cells.push({ x, z });
      }
    }
    return cells;
  }

  private place(id: string, box: BoxGeometry & Rotate & Point) {
    this.boxes.placed[id] = box;

    this.cells(box).forEach((cell) => {
      if (this.relief[`${cell.x}_${cell.z}`]) {
        this.relief[`${cell.x}_${cell.z}`].boxes.push(id);
      } else {
        this.relief[`${cell.x}_${cell.z}`] = { y: 0, boxes: [id] };
      }
      this.relief[`${cell.x}_${cell.z}`].y = this.slice(
        {
          x: cell.x * this.cell.dx + this.cell.dx / 2,
          y: this.dy / 2,
          z: cell.z * this.cell.dz + this.cell.dz / 2,
          dx: this.cell.dx,
          dy: this.dy,
          dz: this.cell.dz,
        },
        this.relief[`${cell.x}_${cell.z}`].boxes.map(
          (id) => this.boxes.placed[id]
        )
      ).height.average;
    });
  }

  private slice(slice: BoxGeometry & Point, boxes: (BoxGeometry & Point)[]) {
    let maxHeight = 0;
    const intersections = boxes.reduce((acc, box) => {
      const intersection = this.intersection(slice, box);
      if (intersection) {
        if (intersection.y + intersection.dy / 2 > maxHeight) {
          maxHeight = intersection.y + intersection.dy / 2;
        }
        acc.push(intersection);
      }
      return acc;
    }, [] as (BoxGeometry & Point)[]);

    const volume = intersections.reduce((acc1, b1, i1, arr) => {
      const _b1 = {
        ...b1,
        y: (b1.y + b1.dy / 2) / 2,
        dy: b1.y + b1.dy / 2,
      };
      const b1_v = _b1.dx * _b1.dy * _b1.dz;

      const b1_s_v = arr.reduce((acc2, b2, i2) => {
        if (i1 === i2) {
          return acc2;
        }
        const sub_b = this.intersection(b1, b2);
        if (sub_b) {
          acc2 += sub_b.dx * sub_b.dy * sub_b.dz;
        }
        return acc2;
      }, 0);

      acc1 += b1_v - b1_s_v;
      return acc1;
    }, 0);

    return {
      height: {
        max: maxHeight,
        average: volume / (slice.dx * slice.dz),
      },
      volume,
    };
  }

  private get cell() {
    return {
      dx: this.dx / this.shape.x,
      dz: this.dz / this.shape.z,
    };
  }
}

const env = new Env({
  dx: 1000,
  dy: 1500,
  dz: 1000,
  shape: {
    x: 100,
    z: 100,
  },
  boxes: {
    placed: {
      "2": {
        dx: 136,
        dy: 150,
        dz: 136,
        x: 68,
        y: 75,
        z: 68,
        rx: false,
        ry: false,
        rz: false,
      },
    },
    unplaced: {
      "1": {
        dx: 100,
        dy: 100,
        dz: 100,
      },
    },
  },
});
console.log(env.getState());
