export function loadImageSize(url: string): Promise<Size> {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.addEventListener("load", e =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight }),
    )
    img.addEventListener("error", () => {
      reject(new Error(`Failed to load image's URL: ${url}`))
    })
    img.src = url
  })
}
