import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"

export interface Model {
  html: string
}

interface Props extends Widget.Props<Model> {}

class HTML extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      html: Reify.string(doc.html),
    }
  }

  render() {
    const { html } = this.props.doc
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <div
            style={style.Fullscreen}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      case "embed":
        return (
          <div style={style.Embed} dangerouslySetInnerHTML={{ __html: html }} />
        )
    }
  }
}

const style = {
  Fullscreen: {
    borderRadius: "3px",
    border: "1px solid #e8e8e8",
  },
  Embed: {
    zoom: 0.25,
    height: "1500px",
  },
}

export default Widget.create("HTML", HTML, HTML.reify)
