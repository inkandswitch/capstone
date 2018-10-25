import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import * as css from "./css/Text.css"
import {
  breakIntoLines,
  DEFAULT_CARD_DIMENSION,
  TEXT_MAX_WIDTH,
  TEXT_CARD_LINE_HEIGHT,
} from "../logic/SizeUtils"

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

const MAX_SCALE = 3
const PADDING = 10

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
    const scale = Math.max(
      1,
      Math.min(
        MAX_SCALE,
        this.props.availableSize.width / DEFAULT_CARD_DIMENSION,
      ),
    )
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
            maxWidth: DEFAULT_CARD_DIMENSION * MAX_SCALE,
            right: 0,
          }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="2"
            width={this.props.availableSize.width - PADDING}
            height={this.props.availableSize.height - 10}
            style={{ overflow: "hidden" }}>
            {this.state.lines.map((line, idx) => {
              const y = 22 + idx * TEXT_CARD_LINE_HEIGHT
              const textStyle =
                idx == 0 ? { font: "bold 8px Arial" } : { font: "6px Arial" }
              return (
                <text
                  style={Object.assign({}, style, textStyle)}
                  x={6 * scale}
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
