import { clamp } from "lodash"

export type ZoomTarget = { position: Point; size: Size }

export function getOrigin(zoomTarget: ZoomTarget, containerDimensions: Size) {
  const {
    position: { x, y },
    size: { height, width },
  } = zoomTarget
  const origin = {
    x: (x / (containerDimensions.width - width)) * 100,
    y: (y / (containerDimensions.height - height)) * 100,
  }
  return origin
}

export function getScaleRatio(targetSize: Size, containerDimensions: Size) {
  return containerDimensions.width / targetSize.width
}

export function getScaleUpFromTarget(
  inputScale: number,
  targetSize: Size,
  containerDimensions: Size,
) {
  const scaleRatio = getScaleRatio(targetSize, containerDimensions)
  const minScale = 1.0
  const maxScale = 1.0 * scaleRatio
  return clamp(inputScale, minScale, maxScale)
}

export function getScaleDownToTarget(
  inputScale: number,
  targetSize: Size,
  containerDimensions: Size,
) {
  const scaleRatio = getScaleRatio(targetSize, containerDimensions)
  const minScale = 1.0 / scaleRatio
  const maxScale = 1.0
  return clamp(inputScale, minScale, maxScale)
}

export function getZoomOutProgress(
  scale: number,
  targetSize: Size,
  containerDimensions: Size,
) {
  const scaleRatio = getScaleRatio(targetSize, containerDimensions)
  const minScale = 1.0 / scaleRatio
  const maxScale = 1.0
  return getZoomProgress(scale, minScale, maxScale)
}

export function getZoomInProgress(
  scale: number,
  targetSize: Size,
  containerDimensions: Size,
) {
  const scaleRatio = getScaleRatio(targetSize, containerDimensions)
  const minScale = 1.0
  const maxScale = 1.0 * scaleRatio
  return getZoomProgress(scale, minScale, maxScale)
}

function getZoomProgress(scale: number, minScale: number, maxScale: number) {
  return (scale - minScale) / (maxScale - minScale)
}
