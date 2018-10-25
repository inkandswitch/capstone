import { AnyDoc } from "automerge/frontend"
import * as Link from "../data/Link"

export const DEFAULT_CARD_DIMENSION = 192
export const CARD_DEFAULT_SIZE = {
  width: DEFAULT_CARD_DIMENSION,
  height: 128,
}
const TEXT_CARD_PADDING = 15
const DEFAULT_FONT_SIZE = 6

const TEXT_MAX_WIDTH = DEFAULT_CARD_DIMENSION - 2 * TEXT_CARD_PADDING
const TEXT_MAX_HEIGHT = DEFAULT_CARD_DIMENSION - 2 * TEXT_CARD_PADDING

export async function calculateInitialSize(
  url: string,
  doc: AnyDoc,
): Promise<Size> {
  const type = Link.parse(url).type
  if (type === "Image") {
    const size = await getImageSize(doc.src as string)
    return resolvedImageCardSize(size)
  } else if (type === "Text") {
    const text = (doc.content as string[]).join("")
    const textSize = getTextSize(text)
    return {
      width: textSize.width + 2 * TEXT_CARD_PADDING,
      height: textSize.height + 2 * TEXT_CARD_PADDING,
    }
  } else {
    return CARD_DEFAULT_SIZE
  }
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

export function getTextWidth(
  text: string,
  fontSize: number,
  fontWeight: string,
): number {
  var element = document.createElement("div")
  var textNode = document.createTextNode("")
  textNode.textContent = text
  element.appendChild(textNode)

  element.style.fontFamily = "Arial, Helvetica, sans-serif"
  element.style.fontSize = `${fontSize}px`
  element.style.fontWeight = fontWeight
  element.style.position = "absolute"
  element.style.visibility = "hidden"
  element.style.left = "-999px"
  element.style.top = "-999px"
  element.style.width = "auto"
  element.style.height = "auto"
  document.body.appendChild(element)

  const width = element.clientWidth
  element.parentNode!.removeChild(element)
  return width
}

function getTextSize(text: string): Size {
  const lines = text.split("\n")
  const fontSize = DEFAULT_FONT_SIZE
  const lineHeight = 1.5
  const lineHeightPx = fontSize * lineHeight

  var element = document.createElement("div")
  var textNode = document.createTextNode("")
  element.appendChild(textNode)
  // TODO - Can we extract those from the CSS somehow?
  element.style.fontFamily = "Arial, Helvetica, sans-serif"
  element.style.fontSize = `${fontSize}px`
  element.style.position = "absolute"
  element.style.visibility = "hidden"
  element.style.lineHeight = `${lineHeight}`
  element.style.left = "-999px"
  element.style.top = "-999px"
  element.style.width = `${TEXT_MAX_WIDTH}px`
  element.style.height = "auto"
  document.body.appendChild(element)

  let totalHeight = 0

  lines.forEach(line => {
    textNode.textContent = line
    totalHeight += Math.max(element.clientHeight, lineHeightPx) // min. 21 to account for empty lines
    console.log(`${Math.max(element.clientHeight, lineHeightPx)} ${line}`)
  })
  element.parentNode!.removeChild(element)

  return {
    width: TEXT_MAX_WIDTH,
    height: Math.max(
      DEFAULT_FONT_SIZE,
      Math.min(TEXT_MAX_HEIGHT, totalHeight - 10),
    ), // subtract line spacing at the end
  }
}

function resolvedImageCardSize(originalSize: Size): Size {
  const scaleFactor = Math.min(
    DEFAULT_CARD_DIMENSION / originalSize.width,
    DEFAULT_CARD_DIMENSION / originalSize.height,
  )
  return {
    width: originalSize.width * scaleFactor,
    height: originalSize.height * scaleFactor,
  }
}
