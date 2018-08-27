import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content, { Mode } from "./Content"

export interface Model {
  docs: Array<{
    url: string
  }>
}

export interface Props {
  selected: string[]
  onTap: (id: string) => void
}

export default class Archive extends Widget<Model, Props> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  show({ docs }: Model) {
    const { selected = [], onTap = () => {} } = this.props

    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {docs.map(({ url }) => (
            <Item url={url} isSelected={selected.includes(url)} onTap={onTap} />
          ))}
        </div>
      </div>
    )
  }
}

interface ItemProps {
  url: string
  isSelected: boolean
  onTap: (url: string) => void
}

class Item extends Preact.Component<ItemProps> {
  render() {
    const { url, isSelected } = this.props
    return (
      <div
        style={{ ...style.Item, ...(isSelected ? style.Item_selected : {}) }}
        draggable
        onClick={this.click}
        onDragStart={this.dragStart}>
        <Content mode="preview" url={url} />
      </div>
    )
  }

  // TODO: replace this with <Touch onTap={...}>...</Touch>
  click = () => {
    this.props.onTap(this.props.url)
  }

  dragStart = (event: DragEvent) => {
    const { url } = this.props
    event.dataTransfer.effectAllowed = "link"
    event.dataTransfer.setData("application/capstone-url", url)
  }
}
const style = {
  Archive: {
    backgroundColor: "rgba(97, 101, 117, 0.9)",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    color: "#fff",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    zIndex: 1,
  },

  Items: {
    display: "flex",
    height: 200,
    alignItems: "center", // TODO: "stretch" is better for vert images
    color: "#333",
    overflow: "auto",
    maxWidth: "100%",
    padding: 40,
  },

  Item: {
    marginRight: 10,
    maxHeight: "100%",
    maxWidth: 200,
    minWidth: 150,
    position: "relative",
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  Item_selected: {
    boxShadow: "0 0 0 2px #D769FA",
  },
}

Content.register("Archive", Archive)
