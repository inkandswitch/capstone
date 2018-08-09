import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget from "./Widget"
import Content from "./Content"

export interface Model {
  content: string
}

export default class Text extends Widget<Model> {
  defaults(): Model {
    return {
      content: samples[random(1, samples.length) - 1],
    }
  }

  show({ content }: Model) {
    return <span style={style.Text}>{content}</span>
  }
}

const style = {
  Text: {
    fontSize: 16,
    fontFamily: "serif",
    padding: 10,
    textAlign: "justify",
    color: "#333",
    lineHeight: 1.5,
  },
}

Content.register("Text", Text)

const samples = [
  "Leonardo da Vinci was a proto-scientist with his mix of empiricism and reasoning by analogy",
  "Historical hindsight suggests his greatest talent was as a painter but he considered himself as much a military engineer and sculptor",
  "Studies of human and animal anatomy, often via dissection, lead to the most realistic poses and musculature of the day",
  "Misconception around his flying machines and other fantastical devices most likely designed for theather performances, not the real world",
]
