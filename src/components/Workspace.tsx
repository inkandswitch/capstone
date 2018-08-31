import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { ArchiveManager } from "./Archive"
import { Doc } from "automerge"
import Touch, { TouchEvent } from "./Touch"

export interface Model {
  backUrls: string[]
  currentUrl: string
  archiveUrl: string
}

export class WorkspaceManager {
  static onMessage(url: string, message: {}) {}
}

export default class Workspace extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      currentUrl: Reify.link(doc.currentUrl),
      backUrls: Reify.array(doc.backUrls),
      archiveUrl: Reify.link(doc.archiveUrl),
    }
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
            dispatch={this.onMessage}
          />
        </div>
      </Touch>
    )
  }

  onMessage = (message: any) => {
    if (!this.doc) return
    if (message.from !== this.doc.archiveUrl) {
      ArchiveManager.onMessage(this.doc.archiveUrl, message)
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
