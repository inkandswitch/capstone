import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import Content from "./Content"
import { Doc } from "automerge"

export interface Model {
  boardUrl: string
  archiveUrl: string
}

export default class Workspace extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      boardUrl: Content.link("Board", doc.boardUrl),
      archiveUrl: Content.link("Archive", doc.archiveUrl),
    }
  }

  show({ boardUrl }: Doc<Model>) {
    return (
      <div class="Workspace">
        <Content mode={this.mode} url={boardUrl} />
      </div>
    )
  }
}

Content.register("Workspace", Workspace)
