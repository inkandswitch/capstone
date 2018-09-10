import * as Preact from "preact"
import * as Reify from "../data/Reify"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge"
import ShelfCard from "./ShelfCard"
import { DocumentActor, Message, FullyFormedMessage } from "./Content"

interface Model {
  selectedUrls: string[]
}

export interface AddToShelf extends Message {
  type: "AddToShelf"
  body: { url: string }
}

export interface ShelfContentsRequested extends Message {
  type: "ShelfContentsRequested"
}

export interface SendShelfContents extends Message {
  type: "SendShelfContents"
  body: { recipientUrl: string }
}

export interface ShelfContents extends Message {
  type: "ShelfContents"
  body: { urls: string[] }
}

type InboundMessage = FullyFormedMessage<AddToShelf | SendShelfContents>
type OutboundMessage = ShelfContents

class ShelfActor extends DocumentActor<Model, InboundMessage, OutboundMessage> {
  async onMessage(message: InboundMessage) {
    switch (message.type) {
      case "AddToShelf": {
        this.change(doc => {
          doc.selectedUrls.push(message.body.url)
          return doc
        })
        break
      }
      case "SendShelfContents": {
        const selectedUrls = this.doc.selectedUrls
        this.emit({
          to: message.body.recipientUrl,
          type: "ShelfContents",
          body: { urls: selectedUrls },
        })
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

class Shelf extends Preact.Component<Widget.Props<Model>> {
  static reify(doc: AnyDoc): Model {
    return {
      selectedUrls: Reify.array(doc.selectedUrls),
    }
  }

  render() {
    const { selectedUrls } = this.props.doc
    const count = selectedUrls.length

    if (count <= 0) return null

    return (
      <div style={style.Shelf}>
        {selectedUrls.map((url, idx) => (
          <ShelfCard key={idx} url={url} index={idx} />
        ))}
      </div>
    )
  }
}

const style = {
  Shelf: {
    position: "absolute",
    bottom: 0,
    right: 0,
    margin: -50,
    boxSizing: "border-box",
    borderRadius: 9999,
    height: 300,
    width: 300,
    backgroundColor: "#7B7E8E",
    zIndex: 2,
  },
}

export default Widget.create("Shelf", Shelf, Shelf.reify, ShelfActor)
