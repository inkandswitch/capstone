import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import TextEditor, { Change } from "./TextEditor"

export interface Model {
  content: string[]
}

interface Props extends Widget.Props<Model> {
  isFocused: boolean
}

class Text extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      content: Reify.array(doc.content),
    }
  }

  render() {
    const { content } = this.props.doc
    return (
      <TextEditor
        content={content.join("")}
        isFocused={this.props.mode === "fullscreen" || this.props.isFocused}
        onChange={this.onChange}
      />
    )
  }

  onChange = (changes: Change[]) => {
    this.props.change(doc => {
      changes.forEach(change => {
        switch (change.type) {
          case "removal": {
            doc.content.splice(change.at, change.length)
            break
          }
          case "insertion": {
            doc.content.splice(change.at, 0, change.content)
            break
          }
          default: {
            console.log("Unknown TextEditor Change type.")
          }
        }
      })
      return doc
    })
  }
}

export default Widget.create("Text", Text, Text.reify)
