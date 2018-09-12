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
  backUrls: string[]
  currentUrl: string
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
    console.log(message)
    switch (message.type) {
      case "DocumentCreated": {
        if (message.from !== this.doc.archiveUrl) {
          this.emit({ ...message, to: this.doc.archiveUrl })
        }
        break
      }
      case "DocumentSelected": {
        if (message.body.url !== this.doc.currentUrl) {
          this.change(doc => {
            doc.backUrls.push(doc.currentUrl)
            doc.currentUrl = message.body.url
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
      currentUrl: Reify.link(doc.currentUrl),
      backUrls: Reify.array(doc.backUrls),
      archiveUrl: Reify.link(doc.archiveUrl),
      shelfUrl: Reify.link(doc.shelfUrl),
    }
  }

  render() {
    const { currentUrl } = this.props.doc
    return (
      <Touch
        onThreeFingerSwipeDown={this.onThreeFingerSwipeDown}
        onThreeFingerSwipeUp={this.onThreeFingerSwipeUp}
        onPinchEnd={this.onPinchEnd}>
        <div class="Workspace" style={style.Workspace}>
          <Content
            mode={this.props.mode}
            url={currentUrl}
            onNavigate={this.navigateTo}
          />
          <Content mode="embed" url={this.props.doc.shelfUrl} />
        </div>
      </Touch>
    )
  }

  onThreeFingerSwipeDown = (event: TouchEvent) => {
    if (this.props.doc.currentUrl !== this.props.doc.archiveUrl) {
      this.navigateTo(this.props.doc.archiveUrl)
    }
  }

  onThreeFingerSwipeUp = (event: TouchEvent) => {
    if (this.props.doc.currentUrl === this.props.doc.archiveUrl) {
      this.navigateBack()
    }
  }

  onPinchEnd = (event: TouchEvent) => {
    if (event.scale > 1) return
    this.navigateBack()
  }

  navigateBack = () => {
    this.props.change(doc => {
      const url = doc.backUrls.pop()
      if (url) {
        doc.currentUrl = url
      }
      return doc
    })
  }

  navigateTo = (url: string) => {
    if (this.props.doc.currentUrl === url) return

    this.props.change(doc => {
      doc.backUrls.push(doc.currentUrl)
      doc.currentUrl = url
      return doc
    })
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
