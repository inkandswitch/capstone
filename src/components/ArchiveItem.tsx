import * as Preact from "preact"
import Content, { Mode } from "./Content"
import Touch from "./Touch"

interface ArchiveItemProps {
  url: string
  isSelected: boolean
  onTap: (url: string) => void
}

export default class ArchiveItem extends Preact.Component<ArchiveItemProps> {
  render() {
    const { url, isSelected } = this.props
    return (
      <Touch onTap={this.onTap}>
        <div
          style={{ ...style.Item, ...(isSelected ? style.Item_selected : {}) }}>
          <Content mode="preview" url={url} />
        </div>
      </Touch>
    )
  }

  onTap = () => {
    this.props.onTap(this.props.url)
  }

  dragStart = (event: DragEvent) => {
    const { url } = this.props
    event.dataTransfer.effectAllowed = "link"
    event.dataTransfer.setData("application/capstone-url", url)
  }
}

const style = {
  Item: {
    position: "relative",
    overflow: "hidden",
  },

  Item_selected: {
    boxShadow: "0 0 0 2px #D769FA",
  },
}
