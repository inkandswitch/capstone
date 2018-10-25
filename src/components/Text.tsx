import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import * as css from "./css/Text.css"
import * as SizeUtils from "../logic/SizeUtils"

const withAvailableSize = require("../modules/react-with-available-size")

export interface State {
  lines: string[]
}

export interface Model {
  content: string[]
}

interface Props extends Widget.Props<Model, State> {
  availableSize: Size
  isFocused: boolean
}

class Text extends React.Component<Props> {
  state: State = { lines: [] }

  static reify(doc: AnyDoc): Model {
    return {
      content: Reify.array(doc.content),
    }
  }

  componentWillMount() {
    const { content } = this.props.doc
    const text = content.join("")
    this.setState({ lines: this.breakIntoLines(text, 164) })
  }

  render() {
    if (!this.state) return
    const scale = Math.max(1, Math.min(3, this.props.availableSize.width / 196))
    const style = {
      position: "relative",
      transformOrigin: "top left",
      transform: `scale(${scale})`,
    }
    return (
      <div className={css.Text}>
        <div
          style={{
            position: "fixed",
            maxWidth: 196 * 3,
            right: 0,
          }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="2"
            width={this.props.availableSize.width - 10}
            height={this.props.availableSize.height}>
            {this.state.lines.map((line, idx) => {
              const y = 22 + (idx == 0 ? 0 : 2) + idx * 10
              if (
                (y + 8) * scale > this.props.availableSize.height - 10 &&
                idx > 0
              )
                return
              const textStyle =
                idx == 0 ? { font: "bold 8px Arial" } : { font: "6px Arial" }
              return (
                <text
                  style={Object.assign({}, style, textStyle)}
                  x="6"
                  y={y}
                  key={idx}>
                  {line}
                </text>
              )
            })}
          </svg>
        </div>
      </div>
    )
  }

  // borrowed and altered from
  // https://stackoverflow.com/questions/21711768/split-string-in-javascript-and-detect-line-break
  breakIntoLines(text: string, maxWidth: number) {
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
        var testWidth = SizeUtils.getTextWidth(testLine, size, weight)
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
}

export default Widget.create(
  "Text",
  withAvailableSize(Text, (domElement: HTMLElement, notify: () => void) => {
    const observer = new ResizeObserver(() => notify())
    observer.observe(domElement)
    return () => observer.unobserve(domElement)
  }),
  Text.reify,
)
