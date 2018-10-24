import * as React from "react"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as DataImport from "./DataImport"
import GPSInput from "./GPSInput"
import { AnyDoc } from "automerge/frontend"
import Content, {
  DocumentActor,
  FullyFormedMessage,
  DocumentCreated,
  ReceiveDocuments,
} from "./Content"
import Clipboard from "./Clipboard"
import { AddToShelf, ShelfContentsRequested, SendShelfContents } from "./Shelf"
import Peers from "./Peers"
import * as Link from "../data/Link"
import { last } from "lodash"
import Pinchable from "./Pinchable"

type NavEntry = { url: string; [extra: string]: any }

export interface Model {
  navStack: NavEntry[]
  rootUrl: string
  shelfUrl: string
}

type WidgetMessage = DocumentCreated | AddToShelf | ReceiveDocuments
type InMessage = FullyFormedMessage<
  DocumentCreated | AddToShelf | ShelfContentsRequested | ReceiveDocuments
>
type OutMessage =
  | DocumentCreated
  | AddToShelf
  | SendShelfContents
  | ReceiveDocuments

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
      case "ReceiveDocuments": {
        const boardsOnStack = this.doc.navStack.filter(
          ({ url }: NavEntry) => Link.parse(url).type == "Board",
        )
        const topBoard = last(boardsOnStack)
        this.emit({
          type: "ReceiveDocuments",
          body: message.body,
          to: topBoard ? topBoard.url : this.doc.rootUrl,
        })
        break
      }
    }
  }
}

class Workspace extends React.Component<Widget.Props<Model, WidgetMessage>> {
  static reify(doc: AnyDoc): Model {
    return {
      navStack: Reify.array(doc.navStack),
      rootUrl: Reify.string(doc.rootUrl),
      shelfUrl: Reify.link(doc.shelfUrl),
    }
  }

  get currentUrl() {
    return this.peek()
  }

  push = (url: string, extraProps: {} = {}) => {
    this.props.change(doc => {
      doc.navStack.push({ url, ...extraProps })
    })
  }

  pop = () => {
    if (this.props.doc.navStack.length === 0) return false

    this.props.change(doc => {
      doc.navStack.pop()
    })
    return true
  }

  peek = () => {
    const { navStack, rootUrl } = this.props.doc
    return navStack[navStack.length - 1] || { url: rootUrl }
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
    const current = this.peek()
    e.clipboardData.setData("text/plain", current.url)
    console.log(`Copied current url to the clipboard: ${current.url}`)
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
      this.props.emit({ type: "ReceiveDocuments", body: { urls } })
      // this.props.emit({ type: "AddToShelf", body: { urls } })
    })
  }

  render() {
    const { shelfUrl, navStack } = this.props.doc
    const { url: currentUrl, ...currentExtra } = this.peek()
    // oh yeah
    const previous =
      navStack.length === 0
        ? undefined
        : navStack.length === 1
          ? { url: this.props.doc.rootUrl }
          : navStack[navStack.length - 2]
    console.log("nav stack", navStack)
    console.log("previous", previous)
    return (
      <div
        className="Workspace"
        style={style.Workspace}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}>
        <GPSInput />
        <Clipboard onCopy={this.onCopy} onPaste={this.onPaste} />
        {previous ? (
          <Content
            key={previous.url + "-previous"}
            mode={this.props.mode}
            url={previous.url}
          />
        ) : null}
        <Content
          key={currentUrl}
          mode={this.props.mode}
          url={currentUrl}
          {...currentExtra}
          onNavigate={this.push}
          onNavigateBack={this.pop}
        />
        <Content mode="embed" url={shelfUrl} />
        <div style={style.Peers}>
          <Peers onTapPeer={this.onTapPeer} />
        </div>
      </div>
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
