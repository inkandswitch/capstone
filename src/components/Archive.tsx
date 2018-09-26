import * as Preact from "preact"
import * as Widget from "./Widget"
import { ReceiveDocuments } from "./Content"
import { AnyDoc, Doc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import ArchiveItem from "./ArchiveItem"
import { Glyph, GlyphEvent } from "./StrokeRecognizer"
import { remove } from "lodash"
import {
  DocumentActor,
  DocumentCreated,
  FullyFormedMessage,
  Message,
} from "./Content"
import { AddToShelf } from "./Shelf"
import * as Feedback from "./CommandFeedback"

export interface Model {
  docs: Array<{
    url: string
  }>
}

interface CreateBoard extends Message {
  type: "CreateBoard"
}

export interface DocumentDeleted extends Message {
  type: "DocumentDeleted"
  body: { url: string }
}

export interface ClearSelection extends Message {
  type: "ClearSelection"
}

type WidgetMessage = AddToShelf | DocumentDeleted
type InMessage = FullyFormedMessage<
  WidgetMessage | DocumentCreated | ReceiveDocuments
>
type OutMessage = AddToShelf

export class ArchiveActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        const { urls } = message.body
        this.change(archive => {
          archive.docs = urls.map(url => ({ url })).concat(archive.docs)
        })
        break
      }
      case "DocumentCreated": {
        this.change(doc => {
          doc.docs.unshift({ url: message.body })
        })
        break
      }
      case "AddToShelf": {
        this.emit({ type: message.type, body: message.body })
        break
      }
      case "DocumentDeleted": {
        this.change((doc: Doc<Model>) => {
          remove(doc.docs, val => val.url === message.body.url)
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
    }
  }

  onGlyphItem = (stroke: GlyphEvent, url: string) => {
    switch (stroke.glyph) {
      case Glyph.copy: {
        Feedback.Provider.add("Add to shelf...", stroke.center)
        this.props.emit({ type: "AddToShelf", body: { url } })
        break
      }
      case Glyph.delete: {
        Feedback.Provider.add("Delete document...", stroke.center)
        this.props.emit({ type: "DocumentDeleted", body: { url } })
        break
      }
    }
  }

  render() {
    const { doc } = this.props

    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {doc.docs.map(({ url }) => (
            <ArchiveItem key={url} url={url} onGlyph={this.onGlyphItem} />
          ))}
        </div>
      </div>
    )
  }
}

const style = {
  Archive: {
    backgroundColor: "#353535",
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
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gridAutoRows: "1fr",
    gridGap: "10px",
    width: "100%",
    padding: 30,
  },
}

export default Widget.create("Archive", Archive, Archive.reify, ArchiveActor)
