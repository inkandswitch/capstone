import * as React from "react"
import { Widget, Reify } from "capstone"
import { AnyDoc } from "automerge/frontend"

export interface Model {
  header: any[]
  content: any[]
}

interface Props extends Widget.Props<Model> {}

class Table extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      header: Reify.array(doc.header),
      content: Reify.array(doc.content),
    }
  }

  render() {
    const { content, header } = this.props.doc

    return (
      <table>
        <thead>
          <tr>
            {header.map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {content.map((obj, i) => (
            <tr key={i}>
              {header.map((key, j) => (
                <td key={j}>{obj[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

export default Widget.create("Table", Table, Table.reify)
