import * as Preact from "preact"
import createWidget, { WidgetProps, AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import ArchiveItem from "./ArchiveItem"

export interface Model {
  docs: Array<{
    url: string
  }>
}

export interface Props extends WidgetProps<Model> {
  selected: string[]
  onTap: (id: string) => void
}

class Archive extends Preact.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  render() {
    const { doc, selected = [], onTap = () => {} } = this.props

    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {doc.docs.map(({ url }) => (
            <ArchiveItem
              url={url}
              isSelected={selected.includes(url)}
              onTap={onTap}
            />
          ))}
        </div>
      </div>
    )
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
}

export default createWidget("Archive", Archive, Archive.reify)
