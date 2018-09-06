import * as Preact from "preact"
import * as Widget from "./Widget"
import { AnyDoc, Doc } from "automerge"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import ArchiveItem from "./ArchiveItem"
import Content, {
  DocumentActor,
  DocumentCreated,
  FullyFormedMessage,
} from "./Content"

export interface Model {
  docs: Array<{
    url: string
  }>
}

type InMessage = FullyFormedMessage & (DocumentCreated)

export class ArchiveActor extends DocumentActor<Model, InMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "DocumentCreated": {
        this.change((doc: Doc<Model>) => {
          doc.docs.unshift({ url: message.body })
          return doc
        })
        break
      }
      default: {
        console.log("Unknown message type")
      }
    }
  }
}

export interface Props extends Widget.Props<Model> {
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, 200px)",
    gridGap: "10px",
    width: "100%",
    color: "#333",
    padding: 40,
  },
}

export default Widget.create("Archive", Archive, Archive.reify, ArchiveActor)
