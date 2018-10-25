import { AnyDoc } from "automerge/frontend"
import * as Link from "../data/Link"

export const DEFAULT_CARD_DIMENSION = 192
export const CARD_DEFAULT_SIZE = {
  width: DEFAULT_CARD_DIMENSION,
  height: 128,
}

export const TEXT_CARD_LINE_HEIGHT = 12

export const TEXT_MAX_WIDTH = DEFAULT_CARD_DIMENSION - 30
const TEXT_MAX_HEIGHT = 200

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
      width: DEFAULT_CARD_DIMENSION,
      height: textSize.height + 20,
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

// borrowed and altered from
// https://stackoverflow.com/questions/21711768/split-string-in-javascript-and-detect-line-break
export function breakIntoLines(text: string, maxWidth: number) {
  const lineBreakMarker = "!@*%$*)%#"
  let lines: string[] = []

  var breaks = text.split("\n")
  var newLines = ""
  for (var i = 0; i < breaks.length; i++) {
    newLines = newLines + breaks[i] + ` ${lineBreakMarker} `
  }

  var words = newLines.split(" ")
  var line = ""
  for (var n = 0; n < words.length; n++) {
    if (words[n] != lineBreakMarker) {
      var testLine = line + words[n] + " "
      const size = lines.length == 0 ? 8 : 6
      const weight = lines.length == 0 ? "bold" : "regular"
      var testWidth = getTextWidth(testLine, size, weight)
      if (testWidth > maxWidth && n > 0) {
        lines.push(line)
        line = words[n] + " "
      } else {
        line = testLine
      }
    } else {
      lines.push(line)
      line = ""
    }
  }
  lines.push(line)
  return lines
}

function getTextSize(text: string): Size {
  const lines = breakIntoLines(text, TEXT_MAX_WIDTH)
  return {
    width: TEXT_MAX_WIDTH,
    height: Math.max(
      Math.min(TEXT_MAX_HEIGHT, lines.length * TEXT_CARD_LINE_HEIGHT - 4),
      8,
    ),
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
