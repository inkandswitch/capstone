import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import { stringify } from "flatted/esm"

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

    console.log("commands", commands)

    if (commands.every(({ result }) => result !== undefined)) {
      return
    }

    this.props.change(doc => {
      const commands = doc.commands || []

      doc.commands.forEach((command, i) => {
        if (command.result) return

        let result

        try {
          result = eval(`(function() { return ${command.code}; })()`)
        } catch (e) {
          result = e
        }

        doc.commands[i].result = stringify(result, null, 2)
      })

      return doc
    })
  }

  render() {
    return null
  }
}

export default Widget.create("REPL", REPL, REPL.reify)
