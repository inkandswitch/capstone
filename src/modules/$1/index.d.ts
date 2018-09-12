export as namespace $1

export class DollarRecognizer {
  constructor()

  AddGesture(name: string, points: Point[]): number
  Recognize(points: Point[], only?: string[]): Result
}

export class Point {
  constructor(x: number, y: number)
  X: number
  Y: number
}

// export class PointCloud {
//   constructor(name: string, points: Point[])
//   Name: string
//   Points: Point[]
// }

export class Result {
  constructor(name: string, score: number, ms: number)
  Name: string
  Score: number
  Time: number
}
