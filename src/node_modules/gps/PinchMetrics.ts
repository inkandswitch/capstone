export interface PointerInput {
  pointerId: number
  x: number
  y: number
}

export interface Measurements {
  distance: number
  center: Point
  scale: number
  delta: number
  initialDistance: number
  distanceHistory: number[]
}

export const init = (input: PointerInput[]): Measurements => {
  const distance = distanceBetween(input[0], input[1])
  const center = midpoint(input)
  return {
    distance,
    center,
    scale: 1,
    delta: 0,
    initialDistance: distance,
    distanceHistory: [distance],
  }
}

export const update = (measurements: Measurements, input: PointerInput[]) => {
  const distance = distanceBetween(input[0], input[1])
  const center = midpoint(input)
  return {
    distance,
    center,
    scale: distance / measurements.initialDistance,
    delta: distance - measurements.initialDistance,
    initialDistance: measurements.initialDistance,
    distanceHistory: [...measurements.distanceHistory, distance],
  }
}

const distanceBetween = (pointerA: PointerInput, pointerB: PointerInput) => {
  return Math.sqrt(
    Math.pow(pointerA.x - pointerB.x, 2) + Math.pow(pointerA.y - pointerB.y, 2),
  )
}

const midpoint = (input: PointerInput[]) => {
  const sums = input.reduce(
    (accum, i) => {
      accum.x += i.x
      accum.y += i.y
      return accum
    },
    { x: 0, y: 0 },
  )
  return {
    x: sums.x / input.length,
    y: sums.y / input.length,
  }
}
