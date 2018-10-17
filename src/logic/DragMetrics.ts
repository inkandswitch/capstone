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
  const incrementalDelta = {
    x: input.x - measurements.position.x,
    y: input.y - measurements.position.y,
  }
  const position = {
    x: measurements.position.x + incrementalDelta.x,
    y: measurements.position.y + incrementalDelta.y,
  }
  const delta = {
    x: measurements.position.x - measurements.startPosition.x,
    y: measurements.position.y - measurements.startPosition.y,
  }
  const magnitude = Math.sqrt(delta.x ** 2 + delta.y ** 2)
  return {
    magnitude,
    position,
    delta,
    startPosition: measurements.startPosition,
  }
}
