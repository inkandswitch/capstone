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
import Peers from "./Peers"
import * as Link from "../data/Link"
import Pinchable from "./Pinchable"
import Shelf from "./Shelf"
import * as css from "./css/Workspace.css"

export interface Model {
  navStack: string[]
  rootUrl: string
  shelfUrl: string
}

type WidgetMessage = DocumentCreated | ReceiveDocuments
type InMessage = FullyFormedMessage<DocumentCreated | ReceiveDocuments>
type OutMessage = DocumentCreated | ReceiveDocuments

class WorkspaceActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        const boardsOnStack = this.doc.navStack.filter(
          url => Link.parse(url).type == "Board",
        )
        this.emit({
          to: this.doc.shelfUrl,
          type: "ReceiveDocuments",
          body: message.body,
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

  push = (url: string) => {
    this.props.change(doc => {
      doc.navStack.push(url)
    })
  }

  pop = () => {
    if (this.props.doc.navStack.length === 0) return

    this.props.change(doc => {
      doc.navStack.pop()
    })
  }

  peek = () => {
    const { navStack, rootUrl } = this.props.doc
    return navStack[navStack.length - 1] || rootUrl
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

  onTapPeer = (identityUrl: string) => {
    this.props.emit({
      to: this.props.doc.shelfUrl,
      type: "ReceiveDocuments",
      body: { urls: [identityUrl] },
    })
  }

  importData = (dataTransfer: DataTransfer) => {
    const urlPromises = DataImport.importData(dataTransfer)
    Promise.all(urlPromises).then(urls => {
      this.props.emit({ type: "ReceiveDocuments", body: { urls } })
    })
  }

  render() {
    const { doc, env } = this.props
    const currentUrl = this.peek()

    if (env.device === "sidecar") {
      return (
        <div>
          <GPSInput />
          <Clipboard onPaste={this.onPaste} />
          <Content mode="fullscreen" noInk url={doc.shelfUrl} />
        </div>
      )
    }

    return (
      <Pinchable onPinchInEnd={this.pop}>
        <div className={css.Workspace}>
          <GPSInput />
          <Clipboard onCopy={this.onCopy} onPaste={this.onPaste} />
          <Content
            key={currentUrl}
            mode={this.props.mode}
            url={currentUrl}
            onNavigate={this.push}
          />

          <Shelf>
            <Content mode="fullscreen" noInk url={doc.shelfUrl} />
          </Shelf>

          <div className={css.Peers}>
            <Peers onTapPeer={this.onTapPeer} />
          </div>
        </div>
      </Pinchable>
    )
  }
}

export default Widget.create(
  "Workspace",
  Workspace,
  Workspace.reify,
  WorkspaceActor,
)
