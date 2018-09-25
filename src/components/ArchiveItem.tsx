import * as Preact from "preact"
import Content from "./Content"
import StrokeRecognizer, { GlyphEvent, Glyph } from "./StrokeRecognizer"
import Touch from "./Touch"

interface ArchiveItemProps {
  url: string
  onGlyph: (stroke: GlyphEvent, url: string) => void
  onDoubleTap: (url: string) => void
}

export default class ArchiveItem extends Preact.Component<ArchiveItemProps> {
  render() {
    const { url } = this.props
    return (
      <StrokeRecognizer onGlyph={this.onGlyph}>
        <Touch onDoubleTap={this.onDoubleTap}>
          <div style={style.Item}>
            <div style={style.ItemContent}>
              <Content mode="preview" url={url} />
              <Content mode="embed" type="NetworkActivity" url={url} />
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
    this.props.onDoubleTap(this.props.url)
  }
}

const style = {
  Item: {
    position: "relative",
    overflow: "hidden",
    height: 200,
  },
  ItemContent: {
    background: "#fff",
    overflow: "hidden",
    maxHeight: "100%'",
    pointerEvents: "none",
  },
}
