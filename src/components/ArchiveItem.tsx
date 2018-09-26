import * as Preact from "preact"
import Content from "./Content"
import StrokeRecognizer, { GlyphEvent, Glyph } from "./StrokeRecognizer"

interface ArchiveItemProps {
  url: string
  onGlyph: (stroke: GlyphEvent, url: string) => void
}

export default class ArchiveItem extends Preact.Component<ArchiveItemProps> {
  render() {
    const { url } = this.props
    return (
      <StrokeRecognizer onGlyph={this.onGlyph}>
        <div style={style.Item}>
          <div style={style.ItemContent}>
            <Content mode="preview" url={url} />
            <div style={style.NetworkActivity}>
              <Content mode="embed" type="NetworkActivity" url={url} />
            </div>
          </div>
        </div>
      </StrokeRecognizer>
    )
  }

  onGlyph = (stroke: GlyphEvent) => {
    this.props.onGlyph(stroke, this.props.url)
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
    position: "relative",
  },
  NetworkActivity: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
}
