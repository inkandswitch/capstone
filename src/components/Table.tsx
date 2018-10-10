import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"

export interface Model {
  content: string
}

interface Props extends Widget.Props<Model> {}

class Table extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      content: Reify.string(doc.content),
    }
  }

  render() {
    const { content } = this.props.doc

    const tabularData = content.split("\n").map(line => line.split(","))

    return (
      <table>
        <tbody>
          {tabularData.map((row, i) => (
            <tr key={i}>
              {row.map((field, j) => (
                <td key={`${i}/${j}`}>{field}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

export default Widget.create("Table", Table, Table.reify)
