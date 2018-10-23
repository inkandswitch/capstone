import * as React from "react"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import { AnyDoc } from "automerge/frontend"

export interface Model {
  id: string
  code: string
}

interface Props extends Widget.Props<Model> {}

interface State {}

class Bot extends React.Component<Props, State> {
  static reify(doc: AnyDoc): Model {
    return {
      id: Reify.string(doc.id),
      code: Reify.string(doc.string),
    }
  }

  render() {
    return (
      <div>
        BOT
        {this.props.doc.id}
        <pre>{this.props.doc.code}</pre>
      </div>
    )
  }
}

export default Widget.create("Bot", Bot, Bot.reify)
