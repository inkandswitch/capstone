import * as Preact from "preact"
import { delay } from "lodash"
import { EventEmitter } from "events"

interface FeedbackData {
  message?: string
}

class ProviderSingleton extends EventEmitter {
  feedback: FeedbackData[] = []
  add(message: string) {
    this.feedback.push({ message })
    this.emit("feedback", this.feedback[0])
    delay(() => this.removeText(), 500)
  }
  removeText() {
    this.feedback.shift()
    this.emit("feedback", this.feedback[0])
  }
}
export let Provider = new ProviderSingleton()

export class Renderer extends Preact.Component {
  state = { message: null }

  componentWillMount() {
    Provider.addListener("feedback", this.handleChange)
  }

  componentWillUnmount() {
    Provider.removeListener("feedback", this.handleChange)
  }

  handleChange = ({ message = "" } = {}) => this.setState({ message })

  render(props: any, state: any) {
    if (!this.state.message) {
      return null
    }
    return <div className="DebugMessage">{this.state.message}</div>
  }
}
