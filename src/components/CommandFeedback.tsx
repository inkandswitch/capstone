import * as Preact from "preact"
import { delay } from "lodash"
import { EventEmitter } from "events"

interface FeedbackData {
  message: String
}

class ProviderSingleton extends EventEmitter {
  constructor() {
    super()
  }
  feedback: FeedbackData[] = []
  add(message: string) {
    this.feedback.push({ message })
    this.emit("feedback", message)
    delay(() => this.removeText(), 1000)
  }
  removeText() {
    this.feedback = []
    this.emit("feedback", null)
  }
}
export let Provider = new ProviderSingleton()

export class Renderer extends Preact.Component {
  listener: Function

  componentWillMount() {
    Provider.addListener("feedback", this.handleChange)
  }

  componentWillUnmount() {
    Provider.removeListener("feedback", this.handleChange)
  }

  handleChange = (message: string) => this.setState({ message })

  render(props: any, state: any) {
    if (Provider.feedback.length == 0) {
      return null
    }
    return <div className="DebugMessage">{Provider.feedback[0].message}</div>
  }
}
