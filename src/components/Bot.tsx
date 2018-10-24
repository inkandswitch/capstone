import * as React from "react"
import * as Reify from "../data/Reify"
import * as Widget from "./Widget"
import * as css from "./css/Bot.css"
import { AnyDoc } from "automerge/frontend"
import { AnyChange } from "./Widget"
import { DocumentActor } from "./Content"

export interface Model {
  id: string
  code: string
}

interface Props extends Widget.Props<Model> {}

interface State {
  error?: string
}

const safeEval = (code: string) => {
  let error

  try {
    eval(`(() => { ${code} })()`)
  } catch (e) {
    error = e
  }

  return error
}

class BotActor extends DocumentActor<Model, AnyChange> {
  async onMessage(message: AnyChange) {
    // console.log(`[BOT MSG (${this.doc.id})]`, message)

    if (!message.from) return

    if (message.from.indexOf("Board")) {
      // TODO: have autonomic and triggerable bots

      // const error = safeEval(this.doc.code)

      // if (error) {
      //   console.log(`[BOT ERR (${this.doc.id})]`, error)
      // }
    }
  }
}

class Bot extends React.Component<Props, State> {
  state = {
    error: undefined,
  }

  static reify(doc: AnyDoc): Model {
    return {
      id: Reify.string(doc.id),
      code: Reify.string(doc.string),
    }
  }

  // componentDidMount() {
  //   this.runCode()
  // }

  // componentDidUpdate(prevProps: Props) {
  //   if (this.props.doc.code !== prevProps.doc.code) {
  //     this.runCode()
  //   }
  // }

  runCode = () => {
    const error = safeEval(this.props.doc.code)
    this.setState({ error })
  }

  render() {
    return (
      <div className={css.Bot}>
        <h3>{this.props.doc.id}</h3>

        <div className={css.BotTriggerButton} onClick={this.runCode}>
          Execute
        </div>

        {this.state.error && (
          <div style={{ color: "red" }}>{this.state.error}</div>
        )}
      </div>
    )
  }
}

export default Widget.create("Bot", Bot, Bot.reify, BotActor)
