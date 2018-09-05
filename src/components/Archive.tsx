import * as Preact from "preact"
import createWidget, { WidgetProps, AnyDoc, Doc } from "./Widget"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import ArchiveItem from "./ArchiveItem"
import Content, { DocumentActor } from "./Content"

export interface Model {
  docs: Array<{
    url: string
  }>
}

export class ArchiveActor extends DocumentActor<Model> {
  // TODO: Find a way to make this a static method of DocumentActor
  static async receive(message: any) {
    const { id } = Link.parse(message.to)
    // TODO: yikes
    const doc =
      Content.readCache<Model>(message.to) ||
      (await Content.open<Model>(message.to))
    const actor = new ArchiveActor(message.to, id, doc)
    actor.onMessage(message)
  }

  onMessage(message: any) {
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

export default createWidget("Archive", Archive, Archive.reify, ArchiveActor)
