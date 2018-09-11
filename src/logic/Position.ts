export const RADIAL_DEFAULT_MAGNITUDE = 70
export const RADIAL_DEFAULT_OFFSET = { x: 0, y: 0 }

export function radial(
  index: number,
  offsetCoordinates: Point = RADIAL_DEFAULT_OFFSET,
  magnitude: number = RADIAL_DEFAULT_MAGNITUDE,
) {
  return {
    x: Math.sin(index * Math.E) * magnitude + offsetCoordinates.x,
    y: Math.cos(index * Math.E) * magnitude + offsetCoordinates.y,
  }
}
