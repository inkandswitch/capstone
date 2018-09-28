import * as Preact from "preact"
import * as Reify from "../data/Reify"
import { Glyph } from "../data/Glyph"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import ShelfCard from "./ShelfCard"
import StrokeRecognizer, { GlyphEvent } from "./StrokeRecognizer"
import { DocumentActor, Message, FullyFormedMessage } from "./Content"
import * as Feedback from "./CommandFeedback"

interface Model {
  selectedUrls: string[]
}

export interface AddToShelf extends Message {
  type: "AddToShelf"
  body: { url?: string; urls?: string[] }
}

export interface ShelfContentsRequested extends Message {
  type: "ShelfContentsRequested"
  body?: { [k: string]: any }
}

export interface SendShelfContents extends Message {
  type: "SendShelfContents"
  body: { recipientUrl: string; [k: string]: any }
}

export interface ShelfContents extends Message {
  type: "ShelfContents"
  body: { urls: string[]; [k: string]: any }
}

export interface ClearShelf extends Message {
  type: "ClearShelf"
}

type WidgetMessage = ClearShelf
type InboundMessage = FullyFormedMessage<
  WidgetMessage | AddToShelf | SendShelfContents
>
type OutboundMessage = ShelfContents

class ShelfActor extends DocumentActor<Model, InboundMessage, OutboundMessage> {
  async onMessage(message: InboundMessage) {
    switch (message.type) {
      case "AddToShelf": {
        this.change(doc => {
          if (message.body.urls) {
            doc.selectedUrls = doc.selectedUrls.concat(message.body.urls)
          } else if (message.body.url) {
            doc.selectedUrls.push(message.body.url)
          }
          return doc
        })
        break
      }
      case "SendShelfContents": {
        const selectedUrls = this.doc.selectedUrls
        const { recipientUrl, ...rest } = message.body
        this.emit({
          to: recipientUrl,
          type: "ShelfContents",
          body: { urls: selectedUrls, ...rest },
        })
        this.change(doc => {
          doc.selectedUrls = []
          return doc
        })
        break
      }
      case "ClearShelf": {
        this.change(doc => {
          doc.selectedUrls = []
          return doc
        })
        break
      }
      default: {
      }
    }
  }
}

class Shelf extends Preact.Component<Widget.Props<Model, WidgetMessage>> {
  static reify(doc: AnyDoc): Model {
    return {
      selectedUrls: Reify.array(doc.selectedUrls),
    }
  }

  onGlyph = (stroke: GlyphEvent) => {
    switch (stroke.glyph) {
      case Glyph.delete:
        Feedback.Provider.add("Clear shelf contents", stroke.center)
        this.props.emit({ type: "ClearShelf" })
    }
  }

  render() {
    const { selectedUrls } = this.props.doc
    const count = selectedUrls.length

    if (count <= 0) return null

    return (
      <StrokeRecognizer onGlyph={this.onGlyph}>
        <div style={style.Shelf}>
          {selectedUrls.map((url, idx) => (
            <ShelfCard key={idx} url={url} index={idx} />
          ))}
        </div>
      </StrokeRecognizer>
    )
  }
}

const style = {
  Shelf: {
    position: "absolute",
    bottom: -100,
    right: -70,
    borderRadius: 9999,
    height: 300,
    width: 300,
    backgroundColor: "#474747",
    zIndex: 2,
  },
}

export default Widget.create("Shelf", Shelf, Shelf.reify, ShelfActor)
