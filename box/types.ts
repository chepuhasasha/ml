export interface Box {
  dx: number, // - размеры по оси x
  dy: number, // - размеры по оси y
  dz: number, // - размеры по оси z
  rx: 0 | 1, // 0 - нельзя врашать вокруг оси x, 1 - можно
  ry: 0 | 1, // 0 - нельзя врашать вокруг оси y, 1 - можно
  rz: 0 | 1, // 0 - нельзя врашать вокруг оси y, 1 - можно
}

export type BoxVector = [number, number, number, number, number, number,]

// ACTIONS
// rotate x
// rotate y
// rotate z
// place index
// ...
