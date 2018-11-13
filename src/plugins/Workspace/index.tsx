import * as React from "react"
import { DataImport, Link, Reify, Widget } from "capstone"
import GPSInput from "gps/Input"
import { AnyDoc } from "automerge/frontend"
import Content, {
  DocumentActor,
  FullyFormedMessage,
  DocumentCreated,
  ReceiveDocuments,
} from "capstone/Content"
import Clipboard from "./Clipboard"
import Shelf from "./Shelf"
import * as css from "./Workspace.css"
import ZoomNav, { NavEntry } from "./ZoomNav"

export interface Model {
  navStack: NavEntry[]
  rootUrl: string
  replUrl: string
  shelfUrl: string
  shelfOffset: number
}

type WidgetMessage = DocumentCreated | ReceiveDocuments
type InMessage = FullyFormedMessage<DocumentCreated | ReceiveDocuments>
type OutMessage = DocumentCreated | ReceiveDocuments

class WorkspaceActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        const urls = []
        for (const url of message.body.urls) {
          const { type } = Link.parse(url)

          if (type === "Workspace") {
            Content.store.setWorkspace(url)
          } else {
            urls.push(url)
          }
        }

        this.emit({
          to: this.doc.shelfUrl,
          type: "ReceiveDocuments",
          body: { urls },
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
      replUrl: Reify.string(doc.replUrl),
      shelfUrl: Reify.link(doc.shelfUrl),
      shelfOffset: Reify.number(doc.shelfOffset),
    }
  }

  static initDoc(): Model {
    return {
      navStack: [],
      rootUrl: Content.create("Board"),
      replUrl: Content.create("REPL"),
      shelfUrl: Content.create("Board"),
      shelfOffset: -200,
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

  importData = (dataTransfer: DataTransfer) => {
    const urlPromises = DataImport.importData(dataTransfer)
    Promise.all(urlPromises).then(urls => {
      this.props.emit({ type: "ReceiveDocuments", body: { urls } })
    })
  }

  render() {
    const { doc, env, mode, url } = this.props

    if (mode !== "fullscreen") {
      return <div>Embedded workspace: {url}</div>
    }

    if (env.device === "sidecar") {
      return (
        <div>
          <GPSInput />
          <Clipboard onPaste={this.onPaste} />
          <Content mode="fullscreen" noInk color="#f0f0f0" url={doc.shelfUrl} />
        </div>
      )
    }

    return (
      <div className={css.Workspace}>
        <GPSInput />
        <Clipboard onCopy={this.onCopy} onPaste={this.onPaste} />
        <ZoomNav
          navStack={doc.navStack}
          rootUrl={doc.rootUrl}
          mode={mode}
          onNavForward={this.push}
          onNavBackward={this.pop}
        />
        <Shelf
          offset={
            this.props.doc.shelfOffset ? this.props.doc.shelfOffset : -200
          }
          onResize={this.onResizeShelf}>
          <Content mode="fullscreen" noInk color="#f0f0f0" url={doc.shelfUrl} />
        </Shelf>
      </div>
    )
  }

  onResizeShelf = (position: Point) => {
    this.props.change(doc => {
      doc.shelfOffset = position.y
    })
  }
}

export default Widget.create(
  "Workspace",
  Workspace,
  Workspace.reify,
  WorkspaceActor,
)
