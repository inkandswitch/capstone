import * as CalculateSize from "calculate-size"
import { AnyDoc } from "automerge/frontend"
import * as Link from "../data/Link"
// import * as css from "../styles/styles.css"

const DEFAULT_CARD_MAX_SIZE = { width: 400, height: 400 }

export function calculateInitialSize(url: string, doc: AnyDoc): Promise<Size> {
  return new Promise((resolve, reject) => {
    const type = Link.parse(url).type
    if (type === "Image") {
      getImageSize(doc.src as string)
        .then(size => {
          resolve(resolvedCardSize(size))
        })
        .catch(() => {
          resolve({ width: 400, height: 400 })
        })
    } else if (type === "Text") {
      resolve(getTextSize((doc.content as string[]).join("")))
    } else if (type === "Board") {
      resolve({ width: 300, height: 200 })
    } else {
      resolve({ width: 400, height: 300 })
    }
  })
}

function getImageSize(src: string): Promise<Size> {
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

function getTextSize(text: string): Size {
  let size = CalculateSize.default(text, {
    fontSize: `12`,
    font: "Roboto, Arial, Helvetica, sans-serif",
    width: `${DEFAULT_CARD_MAX_SIZE.width - 20}`,
  })
  console.log(`text: ${text}`)
  console.log(`size: ${size.height} /  ${size.width}`)
  return { width: 300, height: 300 }
}

function resolvedCardSize(originalSize: Size): Size {
  const scaleFactor = Math.min(
    DEFAULT_CARD_MAX_SIZE.width / originalSize.width,
    DEFAULT_CARD_MAX_SIZE.height / originalSize.height,
  )
  return {
    width: originalSize.width * scaleFactor,
    height: originalSize.height * scaleFactor,
  }
}
