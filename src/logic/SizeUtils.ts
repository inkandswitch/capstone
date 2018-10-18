import * as CalculateSize from "calculate-size"
import { AnyDoc } from "automerge/frontend"
import * as Link from "../data/Link"
// import * as css from "../styles/styles.css"

const TEXT_CARD_PADDING = 15
const DEFAULT_CARD_MAX_SIZE = { width: 400, height: 400 }
const TEXT_MAX_WIDTH = DEFAULT_CARD_MAX_SIZE.width - 2 * TEXT_CARD_PADDING
const TEXT_MAX_HEIGHT = DEFAULT_CARD_MAX_SIZE.height - 2 * TEXT_CARD_PADDING

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
      const textSize = getTextSize((doc.content as string[]).join(""))
      resolve({
        width: textSize.width + 2 * TEXT_CARD_PADDING,
        height: textSize.height + 2 * TEXT_CARD_PADDING,
      })
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
  let options = {
    fontSize: `14px`,
    font: "Roboto, Arial, Helvetica, sans-serif",
  }
  const unconstrainedSize = CalculateSize.default(text, options)
  if (unconstrainedSize.width < TEXT_MAX_WIDTH) {
    return {
      width: unconstrainedSize.width,
      height: Math.min(unconstrainedSize.height - 5, TEXT_MAX_HEIGHT),
    }
  } else {
    const constrainedSize = CalculateSize.default(
      text,
      Object.assign(options, {
        width: `${TEXT_MAX_WIDTH}px`,
      }),
    )
    return {
      width: TEXT_MAX_WIDTH,
      height: Math.min(constrainedSize.height, TEXT_MAX_HEIGHT),
    }
  }
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
