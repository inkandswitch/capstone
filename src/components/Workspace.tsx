import * as Preact from "preact"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import { AnyDoc } from "automerge"
import Content, {
  DocumentActor,
  FullyFormedMessage,
  DocumentCreated,
} from "./Content"
import Touch, { TouchEvent } from "./Touch"
import { DocumentSelected, ClearSelection } from "./Archive"
import { AddToShelf, ShelfContentsRequested, SendShelfContents } from "./Shelf"

export interface Model {
  navStack: string[]
  archiveUrl: string
  shelfUrl: string
}

type InMessage = FullyFormedMessage<
  DocumentCreated | DocumentSelected | AddToShelf | ShelfContentsRequested
>
type OutMessage =
  | DocumentCreated
  | AddToShelf
  | SendShelfContents
  | ClearSelection

class WorkspaceActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "DocumentCreated": {
        if (message.from !== this.doc.archiveUrl) {
          this.emit({ ...message, to: this.doc.archiveUrl })
        }
        break
      }
      case "DocumentSelected": {
        // Clear the navstack and push selected document url.
        const { url } = message.body
        if (url !== this.doc.currentUrl) {
          this.change(doc => {
            doc.navStack = [url]
            return doc
          })
        }
        break
      }
      case "AddToShelf": {
        this.emit({
          type: "AddToShelf",
          body: message.body,
          to: this.doc.shelfUrl,
        })
        break
      }
      case "ShelfContentsRequested": {
        this.emit({
          type: "SendShelfContents",
          body: { recipientUrl: message.from, ...message.body },
          to: this.doc.shelfUrl,
        })
        this.emit({ type: "ClearSelection", to: this.doc.archiveUrl })
        break
      }
    }
  }
}

class Workspace extends Preact.Component<Widget.Props<Model>> {
  static reify(doc: AnyDoc): Model {
    return {
      navStack: Reify.array(doc.navStack),
      archiveUrl: Reify.link(doc.archiveUrl),
      shelfUrl: Reify.link(doc.shelfUrl),
    }
  }

  get isShowingArchive() {
    const { archiveUrl } = this.props.doc
    return this.currentUrl === archiveUrl
  }

  get currentUrl() {
    const { archiveUrl } = this.props.doc
    return this.peek() || archiveUrl
  }

  showArchive = () => {
    const { archiveUrl } = this.props.doc
    if (this.currentUrl === archiveUrl) return
    this.push(archiveUrl)
  }

  hideArchive = () => {
    const { archiveUrl } = this.props.doc
    if (this.currentUrl !== archiveUrl) return
    this.pop()
  }

  push = (url: string) => {
    if (this.peek() === url) return
    this.props.change(doc => {
      doc.navStack.push(url)
      return doc
    })
  }

  pop = () => {
    if (!this.peek()) return
    this.props.change(doc => {
      doc.navStack.pop()
      return doc
    })
  }

  peek = () => {
    const { navStack } = this.props.doc
    return navStack.length ? navStack[navStack.length - 1] : null
  }

  render() {
    return (
      <Touch
        onThreeFingerSwipeDown={this.onThreeFingerSwipeDown}
        onThreeFingerSwipeUp={this.onThreeFingerSwipeUp}
        onPinchEnd={this.onPinchEnd}>
        <div class="Workspace" style={style.Workspace}>
          <Content
            mode={this.props.mode}
            url={this.currentUrl}
            onNavigate={this.push}
          />
          <Content mode="embed" url={this.props.doc.shelfUrl} />
        </div>
      </Touch>
    )
  }

  onThreeFingerSwipeDown = (event: TouchEvent) => {
    this.showArchive()
  }

  onThreeFingerSwipeUp = (event: TouchEvent) => {
    this.hideArchive()
  }

  onPinchEnd = (event: TouchEvent) => {
    if (event.scale > 1) return
    this.pop()
  }
}

const style = {
  Workspace: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
}

export default Widget.create(
  "Workspace",
  Workspace,
  Workspace.reify,
  WorkspaceActor,
)
