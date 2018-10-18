export interface PointerInput {
  pointerId: number
  x: number
  y: number
}

export interface Measurements {
  distance: number
  scale: number
  delta: number
  initialDistance: number
  distanceHistory: number[]
}

export const init = (e: PointerInput[]) => {
  const distance = distanceBetween(e[0], e[1])
  return {
    distance: distance,
    scale: 1,
    delta: 0,
    initialDistance: distance,
    distanceHistory: [distance],
  }
}

const distanceBetween = (pointerA: PointerInput, pointerB: PointerInput) => {
  return Math.sqrt(
    Math.pow(pointerA.x - pointerB.x, 2) + Math.pow(pointerA.y - pointerB.y, 2),
  )
}

export const update = (measurements: Measurements, input: PointerInput[]) => {
  const distance = distanceBetween(input[0], input[1])
  return {
    distance: distance,
    scale: distance / measurements.initialDistance,
    delta: distance - measurements.initialDistance,
    initialDistance: measurements.initialDistance,
    distanceHistory: [...measurements.distanceHistory, distance],
  }
}
