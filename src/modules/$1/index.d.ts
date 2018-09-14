export as namespace $1

export class DollarRecognizer {
  constructor()

  AddGesture(name: string, points: Point[]): number
  Unistrokes: Unistroke[]
  RotateBy(points: Point[], radians: number): Point[]
}

export class Point {
  constructor(x: number, y: number)
  X: number
  Y: number
}

export class Unistroke {
  Name: string
  Points: Point[]
}
