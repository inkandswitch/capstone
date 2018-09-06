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
          doc.selectedUrls.unshift(message.body.url)
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
          <ShelfCard url={url} index={idx} onTap={this.toggleSelect} />
        ))}
        <div style={style.Count}>{count}</div>
      </div>
    )
  }

  toggleSelect = (url: string) => {
    this.props.change(doc => {
      const idx = doc.selectedUrls.indexOf(url)
      if (idx >= 0) {
        doc.selectedUrls.splice(idx, 1)
      } else {
        doc.selectedUrls.push(url)
      }
      return doc
    })
  }
}

const style = {
  Shelf: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: -50,
    boxSizing: "border-box",
    borderRadius: 9999,
    height: 300,
    width: 300,
    backgroundColor: "#7B7E8E",
    zIndex: 2,
  },

  Count: {
    position: "absolute",
    top: 175,
    left: 135,
    transform: "translate(-50%, -50%)",
    borderRadius: 99,
    backgroundColor: "rgba(215, 105, 250, 0.9)",
    color: "white",
    fontSize: 20,
    display: "flex",
    placeContent: "center",
    alignItems: "center",
    minHeight: 40,
    minWidth: 40,
  },
}

export default Widget.create("Shelf", Shelf, Shelf.reify, ShelfActor)
