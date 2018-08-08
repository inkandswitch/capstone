import * as Preact from "preact"
import Base, { AnyDoc } from "./Base"
import Content from "./Content"

export interface Model {
  boardId?: string
}

export default class Workspace extends Base<Model> {
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
