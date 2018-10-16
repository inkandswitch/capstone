import * as CalculateSize from "calculate-size"

const DEFAULT_CARD_MAX_SIZE = { width: 400, height: 400 }

export function loadImageSize(src: string): Promise<Size> {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.addEventListener("load", e =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight }),
    )
    img.addEventListener("error", () => {
      reject(new Error(`Failed to load image: ${src}`))
    })
    img.src = src
  })
}

export function loadTextSize(text: string): Size {
  let size = CalculateSize.default(text, {
    fontSize: "12",
    font: "Arial",
    width: `${DEFAULT_CARD_MAX_SIZE.width - 20}`,
  })
  console.log(`text: ${text}`)
  console.log(`size: ${size.height} /  ${size.width}`)
  return { width: 300, height: 300 }
}

export function resolvedCardSize(originalSize: Size): Size {
  const scaleFactor = Math.min(
    DEFAULT_CARD_MAX_SIZE.width / originalSize.width,
    DEFAULT_CARD_MAX_SIZE.height / originalSize.height,
  )
  return {
    width: originalSize.width * scaleFactor,
    height: originalSize.height * scaleFactor,
  }
}
