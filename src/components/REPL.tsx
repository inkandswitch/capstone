import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import { stringify } from "json-fn"

import * as Debug from "debug"
const log = Debug("component:repl")

type Command = {
  code: string
  result?: string
}

interface Model {
  commands: Command[]
}

interface Props extends Widget.Props<Model> {}

class REPL extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      commands: Reify.array(doc.commands),
    }
  }

  componentDidMount() {
    this.runREPL()
  }

  componentDidUpdate() {
    this.runREPL()
  }

  runREPL = () => {
    const commands = this.props.doc.commands || []

    if (commands.every(({ result }) => result !== undefined)) {
      return
    }

    log("commands", commands)

    this.props.change(doc => {
      const commands = doc.commands || []

      doc.commands.forEach((command, i) => {
        // skip already executed
        if (command.result) return

        let result
        let error

        try {
          result = eval(`(function() { return ${command.code}; })()`)
        } catch (e) {
          error = e
        }

        doc.commands[i].result = stringify({ result, error })
      })

      return doc
    })
  }

  render() {
    return null
  }
}

export default Widget.create("REPL", REPL, REPL.reify)
