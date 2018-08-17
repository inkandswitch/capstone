import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"

export interface Model {
  docs: Array<{
    url: string
  }>
  selected: string[]
}

export default class Archive extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
      selected: Reify.array(doc.selected),
    }
  }

  show({ docs, selected }: Model) {
    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {docs.map(({ url }) => (
            <Item
              url={url}
              isSelected={selected.includes(url)}
              onToggleSelect={this.toggleSelect}
            />
          ))}
        </div>
        <div style={style.Selection} />
      </div>
    )
  }

  toggleSelect = (url: string) => {
    this.change(doc => {
      const idx = doc.selected.indexOf(url)
      if (idx >= 0) {
        doc.selected.splice(idx, 1)
      } else {
        doc.selected.push(url)
      }
    })
  }
}

interface ItemProps {
  url: string
  isSelected: boolean
  onToggleSelect: (url: string) => void
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
    this.props.onToggleSelect(this.props.url)
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
    top: "50%",
    left: 0,
    width: "100%",
    height: "50%",
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

  Selection: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: 10,
  },
}

Content.register("Archive", Archive)
