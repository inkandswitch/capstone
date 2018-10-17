export interface Input {
  x: number
  y: number
}

export interface Measurements {
  magnitude: number
  delta: Point
  position: Point
  startPosition: Point
}

export const init = (e: Input = { x: 0, y: 0 }) => {
  return {
    magnitude: 0,
    delta: { x: 0, y: 0 },
    position: e,
    startPosition: e,
  }
}

export const update = (measurements: Measurements, input: Input) => {
  const position = {
    x: input.x,
    y: input.y,
  }
  const delta = {
    x: position.x - measurements.startPosition.x,
    y: position.y - measurements.startPosition.y,
  }
  const magnitude = Math.hypot(delta.x, delta.y)
  return {
    magnitude,
    position,
    delta,
    startPosition: measurements.startPosition,
  }
}
