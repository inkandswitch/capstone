import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import TextEditor, { Change } from "./TextEditor"
import * as css from "./css/Text.css"

const withAvailableSize = require("../modules/react-with-available-size")

export interface Model {
  content: string[]
}

interface Props extends Widget.Props<Model> {
  availableSize: Size
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
      <div className={css.Text}>what the ffffff</div>
      // <div className={css.Text}>
      //   <TextEditor
      //     content={content.join("")}
      //     isFocused={this.props.mode === "fullscreen" || this.props.isFocused}
      //     onChange={this.onChange}
      //   />
      // </div>
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

export default Widget.create(
  "Text",
  withAvailableSize(Text, (domElement: HTMLElement, notify: () => void) => {
    const observer = new ResizeObserver(() => notify())
    observer.observe(domElement)
    return () => observer.unobserve(domElement)
  }),
  Text.reify,
)
