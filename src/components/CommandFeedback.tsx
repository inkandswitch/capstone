import * as Preact from "preact"
import { delay } from "lodash"
import { EventEmitter } from "events"

interface FeedbackData {
  message?: string
  position?: { x: number; y: number }
}

class ProviderSingleton extends EventEmitter {
  feedback: FeedbackData[] = []
  add(message: string, position: { x: number; y: number }) {
    this.feedback.push({ message, position })
    this.emit("feedback", this.feedback[0])
    delay(() => this.removeText(), 1000)
  }
  removeText() {
    this.feedback.shift()
    this.emit("feedback", this.feedback[0])
  }
}
export let Provider = new ProviderSingleton()

export class Renderer extends Preact.Component {
  state: FeedbackData = { message: "", position: { x: 0, y: 0 } }

  componentWillMount() {
    Provider.addListener("feedback", this.handleChange)
  }

  componentWillUnmount() {
    Provider.removeListener("feedback", this.handleChange)
  }

  handleChange = (feedbackData: FeedbackData) => {
    if (!feedbackData) {
      feedbackData = {}
    }
    this.setState({
      message: feedbackData.message,
      position: feedbackData.position,
    })
  }

  render() {
    const { message, position: { x = 0, y = 0 } = {} } = this.state
    if (!this.state.message) {
      return null
    }
    return (
      <div className="CommandFeedback" style={{ left: x, top: y }}>
        <span className="CommandFeedback__Text">{message}</span>
      </div>
    )
  }
}
