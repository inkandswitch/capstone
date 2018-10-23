import { AnyDoc } from "automerge/frontend"
import * as Link from "../data/Link"

export const CARD_DEFAULT_SIZE = { width: 300, height: 200 }
const TEXT_CARD_PADDING = 15
const IMAGE_CARD_MAX_SIZE = { width: 200, height: 200 }
const DEFAULT_CARD_MAX_SIZE = { width: 400, height: 400 }
const TEXT_MAX_WIDTH = DEFAULT_CARD_MAX_SIZE.width - 2 * TEXT_CARD_PADDING
const TEXT_MAX_HEIGHT = DEFAULT_CARD_MAX_SIZE.height - 2 * TEXT_CARD_PADDING

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

function getTextSize(text: string): Size {
  const lines = text.split("\n")

  var element = document.createElement("div")
  var textNode = document.createTextNode("")
  element.appendChild(textNode)
  // TODO - Can we extract those from the CSS somehow?
  element.style.fontFamily = "Roboto, Arial, Helvetica, sans-serif"
  element.style.fontSize = "14px"
  element.style.position = "absolute"
  element.style.visibility = "hidden"
  element.style.lineHeight = "1.5"
  element.style.left = "-999px"
  element.style.top = "-999px"
  element.style.width = "auto"
  document.body.appendChild(element)

  let longestLine = 0
  lines.forEach(line => {
    textNode.textContent = line
    longestLine = Math.max(longestLine, element.clientWidth)
  })

  // for some when constraining a line to it's above calculated width, it wraps onto two lines.
  // adding an extra 5px fixes that ¯\_(ツ)_/¯
  const resolvedWidth = Math.min(longestLine + 5, TEXT_MAX_WIDTH)
  let totalHeight = 0

  element.style.width = `${resolvedWidth}px`
  element.style.height = "auto"
  lines.forEach(line => {
    textNode.textContent = line
    totalHeight += Math.max(element.clientHeight, 21) // min. 21 to account for empty lines
    console.log(`${Math.max(element.clientHeight, 21)} ${line}`)
  })
  element.parentNode!.removeChild(element)

  return {
    width: Math.min(TEXT_MAX_WIDTH, resolvedWidth),
    height: Math.min(TEXT_MAX_HEIGHT, totalHeight - 10), // subtract line spacing at the end
  }
}

function resolvedImageCardSize(originalSize: Size): Size {
  const scaleFactor = Math.min(
    IMAGE_CARD_MAX_SIZE.width / originalSize.width,
    IMAGE_CARD_MAX_SIZE.height / originalSize.height,
  )
  return {
    width: originalSize.width * scaleFactor,
    height: originalSize.height * scaleFactor,
  }
}
