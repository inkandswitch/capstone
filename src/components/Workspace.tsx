import * as React from "react"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as DataImport from "./DataImport"
import { AnyDoc } from "automerge/frontend"
import Content, {
  DocumentActor,
  FullyFormedMessage,
  DocumentCreated,
} from "./Content"
import Clipboard from "./Clipboard"
import Touch, { TouchEvent } from "./Touch"
import { AddToShelf, ShelfContentsRequested, SendShelfContents } from "./Shelf"
import Peers from "./Peers"

export interface Model {
  navStack: string[]
  identityUrl: string
  rootUrl: string
  shelfUrl: string
}

type WidgetMessage = DocumentCreated | AddToShelf
type InMessage = FullyFormedMessage<
  DocumentCreated | AddToShelf | ShelfContentsRequested
>
type OutMessage = DocumentCreated | AddToShelf | SendShelfContents

class WorkspaceActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "AddToShelf": {
        this.emit({
          type: "AddToShelf",
          body: message.body,
          to: this.doc.shelfUrl,
        })
        break
      }
      case "ShelfContentsRequested": {
        const body = message.body || {}
        this.emit({
          type: "SendShelfContents",
          body: { recipientUrl: message.from, ...body },
          to: this.doc.shelfUrl,
        })
        break
      }
    }
  }
}

class Workspace extends React.Component<Widget.Props<Model, WidgetMessage>> {
  static reify(doc: AnyDoc): Model {
    return {
      identityUrl: Reify.string(doc.identityUrl),
      navStack: Reify.array(doc.navStack),
      rootUrl: Reify.string(doc.rootUrl),
      shelfUrl: Reify.link(doc.shelfUrl),
    }
  }

  get currentUrl() {
    return this.peek()
  }

  push = (url: string) => {
    this.props.change(doc => {
      doc.navStack.push(url)
      return doc
    })
  }

  pop = () => {
    // Don't pop the root url of the stack
    if (this.props.doc.navStack.length === 1) return
    this.props.change(doc => {
      doc.navStack.pop()
      return doc
    })
  }

  peek = () => {
    const { navStack } = this.props.doc
    return navStack[navStack.length - 1]
  }

  onPinchEnd = (event: TouchEvent) => {
    // Prevent popping the last item off the navStack on pinch end.
    if (event.scale > 1 || this.props.doc.navStack.length < 2) return
    this.pop()
  }

  onCopy = (e: ClipboardEvent) => {
    // If an element other than body has focus (e.g. a text card input),
    // don't interfere with normal behavior.
    if (document.activeElement !== document.body) {
      return
    }

    // Otherwise, prevent default behavior and copy the currently active/fullscreen
    // document url to the clipboard.
    e.preventDefault()
    const currentUrl = this.peek()
    e.clipboardData.setData("text/plain", currentUrl)
    console.log(`Copied current url to the clipboard: ${currentUrl}`)
  }

  onPaste = (e: ClipboardEvent) => {
    this.importData(e.clipboardData)
  }

  onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    this.importData(event.dataTransfer)
  }

  onTapPeer = (identityUrl: string) => {
    this.props.emit({ type: "AddToShelf", body: { url: identityUrl } })
  }

  importData = (dataTransfer: DataTransfer) => {
    const urlPromises = DataImport.importData(dataTransfer)
    Promise.all(urlPromises).then(urls => {
      this.props.emit({ type: "AddToShelf", body: { urls } })
    })
  }

  render() {
    const { shelfUrl } = this.props.doc
    const currentUrl = this.peek()
    return (
      <Touch onPinchEnd={this.onPinchEnd}>
        <div
          className="Workspace"
          style={style.Workspace}
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}>
          <Clipboard onCopy={this.onCopy} onPaste={this.onPaste} />
          <Content
            key={currentUrl}
            mode={this.props.mode}
            url={currentUrl}
            onNavigate={this.push}
          />
          <Content mode="embed" url={shelfUrl} />
          <div style={style.Peers}>
            <Peers onTapPeer={this.onTapPeer} />
          </div>
        </div>
      </Touch>
    )
  }
}

const style = {
  Workspace: {
    position: "absolute" as "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  Peers: {
    position: "absolute" as "absolute",
    top: 0,
    right: 0,
    bottom: 0,
  },
}

export default Widget.create(
  "Workspace",
  Workspace,
  Workspace.reify,
  WorkspaceActor,
)
