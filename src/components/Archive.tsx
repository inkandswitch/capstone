import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content, { Mode } from "./Content"
import ArchiveItem from "./ArchiveItem"

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

Content.register("Archive", Archive)
