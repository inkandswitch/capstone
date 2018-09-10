import * as Preact from "preact"
import Content from "./Content"
import Touch from "./Touch"
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
        <div
          style={{
            ...style.Item,
            ...(isSelected ? style.Item_selected : {}),
          }}>
          <Content mode="preview" url={url} />
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

  Item_selected: {
    boxShadow: "0 0 0 2px #D769FA",
  },
}
