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
