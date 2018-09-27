import * as Preact from "preact"

import Content from "./Content"
import StrokeRecognizer, { GlyphEvent } from "./StrokeRecognizer"
import Touch from "./Touch"

interface Props {
  url: string
  onGlyph: (stroke: GlyphEvent, url: string) => void
  onDoubleTap?: (url: string) => void
}

export default class Cell extends Preact.Component<Props> {
  render() {
    const { url } = this.props
    return (
      <StrokeRecognizer onGlyph={this.onGlyph}>
        <Touch onDoubleTap={this.onDoubleTap}>
          <div style={style.Cell}>
            <div style={style.CellContent}>
              <Content mode="preview" url={url} />
              <div style={style.NetworkActivity}>
                <Content mode="embed" type="NetworkActivity" url={url} />
              </div>
            </div>
          </div>
        </Touch>
      </StrokeRecognizer>
    )
  }

  onGlyph = (stroke: GlyphEvent) => {
    this.props.onGlyph(stroke, this.props.url)
  }

  onDoubleTap = () => {
    this.props.onDoubleTap && this.props.onDoubleTap(this.props.url)
  }
}

const style = {
  Cell: {
    position: "relative",
    overflow: "hidden",
    height: 200,
  },
  CellContent: {
    background: "#fff",
    overflow: "hidden",
    maxHeight: "100%'",
    pointerEvents: "none",
    position: "relative",
  },
  NetworkActivity: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
}
