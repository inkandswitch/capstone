import { random } from "lodash/fp"
import * as Preact from "preact"
import createWidget, { WidgetProps, AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import TextEditor, { Change } from "./TextEditor"

export interface Model {
  content: string[]
}

interface Props extends WidgetProps<Model> {
  isFocused: boolean
}

class Text extends Preact.Component<Props> {
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

const sample = (): string => samples[random(1, samples.length) - 1]

const samples = [
  "Leonardo da Vinci was a proto-scientist with his mix of empiricism and reasoning by analogy",
  "Historical hindsight suggests his greatest talent was as a painter but he considered himself as much a military engineer and sculptor",
  "Studies of human and animal anatomy, often via dissection, lead to the most realistic poses and musculature of the day",
  "Misconception around his flying machines and other fantastical devices most likely designed for theather performances, not the real world",
]

export default createWidget("Text", Text, Text.reify)
