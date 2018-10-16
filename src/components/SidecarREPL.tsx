import * as React from "react"
import { once } from "lodash"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { AnyDoc, AnyEditDoc, ChangeFn } from "automerge/frontend"
import Clipboard from "./Clipboard"
import * as DataImport from "./DataImport"

type Command = {
  code: string
  result?: string
}

interface Model {
  commands: Command[]
}

interface Props extends Widget.Props<Model> {}

interface State {}

export default class SidecarREPL extends React.Component<Props, State> {
  static reify(doc: AnyDoc): Model {
    return {
      commands: Reify.array(doc.commands),
    }
  }

  state = {
    currentCode: "",
  }

  onChange = e => {
    const { value } = e.target
    this.setState({ currentCode: value })
  }

  onEval = () => {
    const { currentCode } = this.state

    this.props.change(doc => {
      if (!doc.commands) {
        doc.commands = []
      }

      doc.commands.push({ code: currentCode })

      return doc
    })

    this.setState({ currentCode: "" })
  }

  render() {
    console.log(this.props.doc)

    return (
      <div>
        {(this.props.doc.commands || []).map(({ code, result }, i) => (
          <div key={i}>
            <pre>
              [{i}] {code}:
            </pre>
            <pre>{result || "not executed"}</pre>
          </div>
        ))}

        <textarea onChange={this.onChange} value={this.state.currentCode} />
        <button onClick={this.onEval}>eval</button>
      </div>
    )
  }
}

Widget.create("SidecarREPL", SidecarREPL, SidecarREPL.reify)
