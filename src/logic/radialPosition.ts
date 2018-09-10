export default function radialPosition(
  index: number,
  offsetCoordinate: { x: number; y: number },
  magnitude: number,
) {
  return {
    x: Math.sin(index * Math.E) * magnitude + offsetCoordinate.x,
    y: Math.cos(index * Math.E) * magnitude + offsetCoordinate.y,
  }
}
