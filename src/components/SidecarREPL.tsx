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

  onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  onReset = () => {
    this.props.change(doc => {
      doc.commands = []
      return doc
    })

    this.setState({ currentCode: "" })
  }

  render() {
    return (
      <div>
        <button onClick={this.onReset}>Reset REPL</button>

        <div>
          {(this.props.doc.commands || []).map(({ code, result }, i) => (
            <div key={i}>
              <pre>
                [{i}] {code}
              </pre>
              <pre>{result || "not executed"}</pre>
              <hr />
            </div>
          ))}

          <div>
            <div>
              <textarea
                rows={10}
                cols={80}
                onChange={this.onChange}
                value={this.state.currentCode}
              />
            </div>
            <div>
              <button onClick={this.onEval}>eval</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

Widget.create("SidecarREPL", SidecarREPL, SidecarREPL.reify)
