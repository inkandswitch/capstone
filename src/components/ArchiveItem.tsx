import * as Preact from "preact"
import Content from "./Content"
import StrokeRecognizer from "./StrokeRecognizer"

interface ArchiveItemProps {
  url: string
  isSelected: boolean
  onStroke: (url: string) => void
}

export default class ArchiveItem extends Preact.Component<ArchiveItemProps> {
  render() {
    const { url, isSelected } = this.props
    return (
      <StrokeRecognizer onStroke={this.onStroke} only={["uparrow"]}>
        <div style={style.Item}>
          <div style={style.ItemContent}>
            <Content mode="preview" url={url} />
          </div>
        </div>
      </StrokeRecognizer>
    )
  }

  onStroke = () => {
    this.props.onStroke(this.props.url)
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
  },
}
