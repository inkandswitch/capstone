import * as React from "react"
import { Widget, Reify } from "capstone"
import { AnyDoc } from "automerge/frontend"
import * as css from "./Text.css"
import { clamp } from "lodash"
import {
  breakIntoLines,
  TEXT_MAX_WIDTH,
  TEXT_CARD_LINE_HEIGHT,
} from "capstone/SizeUtils"

const withAvailableSize = require("react-with-available-size")

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

const MAX_SCALE = 3

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
    this.setState({ lines: breakIntoLines(text, TEXT_MAX_WIDTH) })
  }

  render() {
    if (!this.state) return
    const scale = clamp(
      (this.props.availableSize.width * 0.85) / TEXT_MAX_WIDTH,
      1,
      MAX_SCALE,
    )
    const style = {
      position: "relative",
      transformOrigin: "top left",
      transform: `scale(${scale})`,
    }
    const shouldScroll = this.props.mode === "fullscreen"
    const maxContentWidth = TEXT_MAX_WIDTH * MAX_SCALE
    return (
      <div
        className={css.Text}
        style={{ overflow: shouldScroll ? "scroll" : "hidden" }}>
        <div
          style={{
            width: "85%",
            display: "inline-block",
            maxWidth: maxContentWidth,
          }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="2"
            width={Math.min(
              maxContentWidth,
              this.props.availableSize.width * 0.85,
            )}
            height={
              shouldScroll
                ? TEXT_CARD_LINE_HEIGHT * scale * this.state.lines.length + 100
                : this.props.availableSize.height - 10
            }
            style={{ overflow: "hidden" }}>
            {this.state.lines.map((line, idx) => {
              const y = 22 + idx * TEXT_CARD_LINE_HEIGHT
              const textStyle =
                idx == 0 ? { font: "bold 8px Roboto" } : { font: "6px Roboto" }
              return (
                <text
                  style={Object.assign({}, style, textStyle)}
                  x={0}
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
