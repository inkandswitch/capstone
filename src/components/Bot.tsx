import * as Link from "../data/Link"
import * as React from "react"
import * as Reify from "../data/Reify"
import * as Widget from "./Widget"
import * as css from "./css/Bot.css"
import { AnyChange } from "./Widget"
import { AnyDoc } from "automerge/frontend"
import { DocumentActor } from "./Content"

window.BotStore = window.BotStore || new Map()

window.makeBot = (id: string, callback: Function) => {
  if (!id || !callback) {
    console.log("id or callback missing, ignoring bot")
    return
  }

  if (window.BotStore.has(id)) {
    window.BotStore.delete(id)
  }

  window.BotStore.set(id, {})

  callback({
    autonomous: (type: string, cb: Function) => {
      window.BotStore.set(id, {
        ...window.BotStore.get(id),
        autonomous: {
          ...(window.BotStore.get(id).autonomous || {}),
          [type]: cb,
        },
      })
    },

    action: (name: string, cb: Function) => {
      window.BotStore.set(id, {
        ...window.BotStore.get(id),
        actions: {
          ...(window.BotStore.get(id).actions || {}),
          [name]: cb,
        },
      })
    },
  })
}

export interface Model {
  id: string
  code: string
}

interface Props extends Widget.Props<Model> {}

interface State {
  error?: string
  lastUpdate: number
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
    const bot = window.BotStore.get(this.doc.id)

    if (!bot || !bot.autonomous) return
    if (!message.from) return

    const { type } = Link.parse(message.from)
    bot.autonomous[type] && bot.autonomous[type]()
  }
}

class Bot extends React.Component<Props, State> {
  state = {
    error: undefined,
    lastUpdate: 0,
  }

  static reify(doc: AnyDoc): Model {
    return {
      id: Reify.string(doc.id),
      code: Reify.string(doc.string),
    }
  }

  componentDidMount() {
    this.runCode()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.doc.code !== prevProps.doc.code) {
      this.runCode()
    }
  }

  runCode = () => {
    const error = safeEval(this.props.doc.code)

    this.setState({
      lastUpdate: Date.now(),
      error: error && error.toString(),
    })
  }

  runAction = (actionName: string) => {
    const action = window.BotStore.get(this.props.doc.id).actions[actionName]
    action && action()
  }

  render() {
    const botInStore =
      window.BotStore && window.BotStore.has(this.props.doc.id)
        ? window.BotStore.get(this.props.doc.id)
        : undefined

    const isAutonomuos = botInStore
      ? Object.keys(botInStore.autonomous || {}).length > 0
      : false

    const actions = botInStore ? Object.keys(botInStore.actions || {}) : []

    return (
      <div className={css.Bot}>
        <h3>{this.props.doc.id}</h3>

        {isAutonomuos && <h4>(autonomous)</h4>}

        {actions.map(actionName => (
          <div
            key={actionName}
            className={css.BotTriggerButton}
            onClick={() => this.runAction(actionName)}>
            {actionName}
          </div>
        ))}

        {this.state.error && (
          <div style={{ color: "red" }}>{this.state.error}</div>
        )}
      </div>
    )
  }
}

export default Widget.create("Bot", Bot, Bot.reify, BotActor)
