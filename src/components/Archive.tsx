import * as Preact from "preact"
import * as Widget from "./Widget"
import { AnyDoc, Doc } from "automerge"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import ArchiveItem from "./ArchiveItem"
import {
  DocumentActor,
  DocumentCreated,
  FullyFormedMessage,
  Message,
} from "./Content"

export interface Model {
  docs: Array<{
    url: string
  }>
  selected: string[]
}

export interface DocumentSelected extends Message {
  type: "DocumentSelected"
  body: { url: string }
}

export interface ClearSelection extends Message {
  type: "ClearSelection"
}

type WidgetMessage = DocumentSelected
type InMessage = FullyFormedMessage<
  DocumentCreated | DocumentSelected | ClearSelection
>
type OutMessage = DocumentSelected

export class ArchiveActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "DocumentCreated": {
        this.change(doc => {
          doc.docs.unshift({ url: message.body })
          return doc
        })
        break
      }
      case "DocumentSelected": {
        this.emit({ type: message.type, body: message.body })
        break
      }
      case "ClearSelection": {
        this.change(doc => {
          doc.selected = []
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

export interface Props extends Widget.Props<Model, WidgetMessage> {
  onTap: (id: string) => void
}

class Archive extends Preact.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
      selected: Reify.array(doc.selected),
    }
  }

  onStrokeItem = (url: string) => {
    this.props.emit({ type: "DocumentSelected", body: { url } })
  }

  render() {
    const { doc } = this.props

    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {doc.docs.map(({ url }) => (
            <ArchiveItem
              url={url}
              isSelected={doc.selected.includes(url)}
              onStroke={this.onStrokeItem}
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
    overflow: "hidden",
    zIndex: 1,
  },

  Items: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gridAutoRows: "1fr",
    gridGap: "10px",
    width: "100%",
    color: "#333",
    padding: 40,
  },
}

export default Widget.create("Archive", Archive, Archive.reify, ArchiveActor)
