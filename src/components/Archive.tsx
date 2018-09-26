import * as Preact from "preact"
import { remove } from "lodash"
import { AnyDoc, Doc } from "automerge/frontend"

import * as Reify from "../data/Reify"
import * as Widget from "./Widget"
import { ReceiveDocuments } from "./Content"
import DocumentGrid from "./DocumentGrid"
import DocumentGridCell from "./DocumentGridCell"
import { Glyph, GlyphEvent } from "./StrokeRecognizer"
import { DocumentActor, DocumentCreated, Message } from "./Content"
import { AddToShelf, ShelfContentsRequested } from "./Shelf"
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

type WidgetMessage = AddToShelf | DocumentDeleted | ShelfContentsRequested
type InMessage = WidgetMessage | DocumentCreated | ReceiveDocuments
type OutMessage = AddToShelf | ShelfContentsRequested

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
      case "ShelfContentsRequested": {
        this.emit({ type: message.type, body: message.body })
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
      case Glyph.paste: {
        this.props.emit({
          type: "ShelfContentsRequested",
          body: { recipientUrl: url },
        })
      }
    }
  }

  render() {
    const { doc } = this.props

    return (
      <div style={style.Archive}>
        <DocumentGrid>
          {doc.docs.map(({ url }) => (
            <DocumentGridCell key={url} url={url} onGlyph={this.onGlyphItem} />
          ))}
        </DocumentGrid>
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
    padding: 30,
  },
}

export default Widget.create("Archive", Archive, Archive.reify, ArchiveActor)
