export const DEFAULT_MAGNITUDE = 80
export const DEFAULT_OFFSET_COORDINATES = { x: 0, y: 0 }

export default function radialPosition(
  index: number,
  offsetCoordinates: { x: number; y: number } = DEFAULT_OFFSET_COORDINATES,
  magnitude: number = DEFAULT_MAGNITUDE,
) {
  return {
    x: Math.sin(index * Math.E) * magnitude + offsetCoordinates.x,
    y: Math.cos(index * Math.E) * magnitude + offsetCoordinates.y,
  }
}
