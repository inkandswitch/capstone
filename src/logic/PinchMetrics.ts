export interface PointerInput {
  pointerId: number
  x: number
  y: number
}

export interface Measurements {
  distance: number
  distanceHistory: number[]
}

export const init = (e: PointerInput[]) => {
  const distance = distanceBetween(e.pointerA, e.pointerB)
  return {
    distance: distance,
    distanceHistory: [distance],
  }
}

const distanceBetween = (pointerA: PointerMetric, pointerB: PointerMetric) => {
  return Math.sqrt(
    Math.pow(pointerA.x - pointerB.x, 2) + Math.pow(pointerA.y - pointerB.y, 2),
  )
}

export const update = (measurements: Measurements, input: Input) => {
  const distance = distanceBetween(input.pointerA, input.pointerB)
  return {
    distance: distance,
    // pointerA: input.pointerA,
    // pointerB: input.pointerB,
    distanceHistory: [...measurements.distanceHistory, distance],
  }
}
