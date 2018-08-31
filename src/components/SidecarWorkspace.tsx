import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { Doc } from "automerge"

export interface Model {
  archiveUrl: string
}

export default class SidecarWorkspace extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      archiveUrl: Reify.link(doc.archiveUrl),
    }
  }

  show({ archiveUrl }: Doc<Model>) {
    return <Content mode="fullscreen" type="SidecarUploader" url={archiveUrl} />
  }
}

Content.register("SidecarWorkspace", SidecarWorkspace)
