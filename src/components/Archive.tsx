import * as Preact from "preact"
import * as Widget from "./Widget"
import Content from "./Content"
import { AnyDoc, Doc } from "automerge"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import ArchiveItem from "./ArchiveItem"
import StrokeRecognizer, { Stroke, GLYPHS } from "./StrokeRecognizer"
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

interface CreateBoard extends Message {
  type: "CreateBoard"
}

export interface DocumentSelected extends Message {
  type: "DocumentSelected"
  body: { url: string }
}

export interface DocumentDeleted extends Message {
  type: "DocumentDeleted"
  body: { url: string }
}

export interface ClearSelection extends Message {
  type: "ClearSelection"
}

type WidgetMessage = DocumentSelected | CreateBoard | DocumentDeleted
type InMessage = FullyFormedMessage<
  WidgetMessage | DocumentCreated | ClearSelection
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
      case "CreateBoard": {
        const url = await Content.create("Board")
        this.change(doc => {
          doc.docs.unshift({ url: url })
          return doc
        })
        break
      }
      case "DocumentDeleted": {
        this.change(doc => {
          // XXX - is this the best way to delete a doc?
          // probably would be nice to have a helper function for this
          const idx = doc.docs.findIndex((value: { url: string }) => {
            return message.body.url == value.url
          })
          if (idx > -1) {
            doc.docs.splice(idx, 1)
          }
          return doc
        })
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

  onStroke = (stroke: Stroke) => {
    switch (stroke.name) {
      case GLYPHS.create: {
        this.props.emit({ type: "CreateBoard" })
        break
      }
    }
  }

  onStrokeItem = (stroke: Stroke, url: string) => {
    switch (stroke.name) {
      case GLYPHS.copy: {
        this.props.emit({ type: "DocumentSelected", body: { url } })
        break
      }
      case GLYPHS.delete: {
        this.props.emit({ type: "DocumentDeleted", body: { url } })
        break
      }
    }
  }

  render() {
    const { doc } = this.props

    return (
      <StrokeRecognizer onStroke={this.onStroke} only={["box"]}>
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
      </StrokeRecognizer>
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
    overflow: "hidden",
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
