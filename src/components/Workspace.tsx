import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import Content from "./Content"

export interface Model {
  boardId?: string
}

export default class Workspace extends Widget<Model> {
  defaults(): Model {
    return {}
  }

  show({ boardId }: Model) {
    return (
      <div class="Workspace">
        <Content type="Board" id={boardId} />
      </div>
    )
  }
}

Content.register("Workspace", Workspace)
