import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { Doc } from "automerge"
import Touch, { TouchEvent } from "./Touch"
import * as Pubsub from "../messaging/pubsub"

export interface Model {
  backUrls: string[]
  currentUrl: string
  archiveUrl: string
}

export default class Workspace extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      currentUrl: Reify.link(doc.currentUrl),
      backUrls: Reify.array(doc.backUrls),
      archiveUrl: Reify.link(doc.archiveUrl),
    }
  }

  unsubscribeCurrentUrl: Pubsub.Unsubscribe | null = null
  unsubscribeArchiveUrl: Pubsub.Unsubscribe | null = null

  componentDidMount() {
    if (!this.doc) return
    this.unsubscribeCurrentUrl = this.subscribe(
      this.doc.currentUrl,
      this.onBroadcastMessage,
    )
    this.unsubscribeArchiveUrl = this.subscribe(
      this.doc.archiveUrl,
      this.onBroadcastMessage,
    )
  }

  componentWillUnmount() {
    if (!this.doc) return
    if (this.unsubscribeArchiveUrl) {
      this.unsubscribeArchiveUrl()
      this.unsubscribeArchiveUrl = null
    }
    if (this.unsubscribeCurrentUrl) {
      this.unsubscribeCurrentUrl()
      this.unsubscribeCurrentUrl = null
    }
  }

  componentDidUpdate(prevProps: {}, prevState: { doc: Doc<Model> }) {
    if (!this.state.doc) return
    // TODO: compare previous url with current url once we no longer mutate
    // the doc during updates.
    this.unsubscribeCurrentUrl && this.unsubscribeCurrentUrl()
    this.unsubscribeCurrentUrl = this.subscribe(
      this.state.doc.currentUrl,
      this.onBroadcastMessage,
    )
  }

  show({ currentUrl }: Doc<Model>) {
    return (
      <Touch
        onThreeFingerSwipeDown={this.onThreeFingerSwipeDown}
        onThreeFingerSwipeUp={this.onThreeFingerSwipeUp}
        onPinchEnd={this.onPinchEnd}>
        <div class="Workspace" style={style.Workspace}>
          <Content
            mode={this.mode}
            url={currentUrl}
            onNavigate={this.navigateTo}
          />
        </div>
      </Touch>
    )
  }

  onBroadcastMessage = (message: any, url: string) => {
    if (!this.doc) return
    if (message.type === "DocumentCreated" && url !== this.doc.archiveUrl) {
      this.sendMessage(this.doc.archiveUrl, message)
    }
  }

  onThreeFingerSwipeDown = (event: TouchEvent) => {
    if (!this.doc) return
    if (this.doc.currentUrl !== this.doc.archiveUrl) {
      this.navigateTo(this.doc.archiveUrl)
    }
  }

  onThreeFingerSwipeUp = (event: TouchEvent) => {
    if (!this.doc) return
    if (this.doc.currentUrl === this.doc.archiveUrl) {
      this.navigateBack()
    }
  }

  onPinchEnd = (event: TouchEvent) => {
    if (event.scale > 1) return
    this.navigateBack()
  }

  navigateBack = () => {
    this.change(doc => {
      const url = doc.backUrls.pop()
      if (url) {
        doc.currentUrl = url
      }
      return doc
    })
  }

  navigateTo = (url: string) => {
    if (this.doc && this.doc.currentUrl === url) return

    this.change(doc => {
      doc.backUrls.push(doc.currentUrl)
      doc.currentUrl = url
      return doc
    })
  }
}

Content.register("Workspace", Workspace)

const style = {
  Workspace: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
}
