export as namespace $P

export class Recognizer {
  constructor()

  AddGesture(name: string, points: Point[]): number
  Recognize(points: Point[], only?: string[]): Result
}

export class Point {
  constructor(x: number, y: number, id: number, angle?: number)
  X: number
  Y: number
  ID: number
  Angle: number
}

export class PointCloud {
  constructor(name: string, points: Point[])
  Name: string
  Points: Point[]
}

export class Result {
  constructor(name: string, score: number, ms: number)
  Name: string
  Score: number
  Time: number
}
