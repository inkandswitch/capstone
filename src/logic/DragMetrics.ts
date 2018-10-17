export interface Input {
  x: number
  y: number
}

export interface Metrics {
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

export const update = (metrics: Metrics, input: Input) => {
  const incrementalDelta = {
    x: input.x - metrics.position.x,
    y: input.y - metrics.position.y,
  }
  const position = {
    x: metrics.position.x + incrementalDelta.x,
    y: metrics.position.y + incrementalDelta.y,
  }
  const delta = {
    x: metrics.position.x - metrics.startPosition.x,
    y: metrics.position.y - metrics.startPosition.y,
  }
  const magnitude = Math.sqrt(delta.x ** 2 + delta.y ** 2)
  return {
    magnitude,
    position,
    delta,
    startPosition: metrics.startPosition,
  }
}
