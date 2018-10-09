import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"

export interface Model {
  content: string
}

interface Props extends Widget.Props<Model> {}

class HTML extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      content: Reify.string(doc.html),
    }
  }

  render() {
    const { html } = this.props.doc
    return <div dangerouslySetInnerHTML={{ __html: html as string }} />
  }
}

export default Widget.create("HTML", HTML, HTML.reify)
