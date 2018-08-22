import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { Doc } from "automerge"
import Gesture from "./Gesture"

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

  show({ currentUrl }: Doc<Model>) {
    return (
      <Gesture onPinchEnd={this.onPinch}>
        <div class="Workspace" style={style.Workspace}>
          <Content
            mode={this.mode}
            url={currentUrl}
            onPinchCard={this.fullscreen}
          />
        </div>
      </Gesture>
    )
  }

  onPinch = (event: HammerInput) => {
    if (event.scale > 1) return
    this.back()
  }

  back = () => {
    this.change(doc => {
      const url = doc.backUrls.pop()
      if (url) {
        doc.currentUrl = url
      }
      return doc
    })
  }

  fullscreen = (url: string) => {
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
