import * as Preact from "preact"
import { delay } from "lodash"
import { EventEmitter } from "events"

interface FeedbackRendererState {
  feedback: FeedbackData[]
}

interface FeedbackData {
  id: number
  message?: string
  position?: { x: number; y: number }
}

class ProviderSingleton extends EventEmitter {
  feedbackId = 0
  add(message: string, position: { x: number; y: number }) {
    const feedback: FeedbackData = { message, position, id: this.feedbackId++ }
    this.emit("feedback", feedback)
  }
}

export let Provider = new ProviderSingleton()

class FeedbackItem extends Preact.Component<FeedbackData> {
  render() {
    const { message, position: { x = 0, y = 0 } = {} } = this.props
    if (!this.props.message) {
      return null
    }
    return (
      <div className="CommandFeedback" style={{ left: x, top: y }}>
        <span className="CommandFeedback__Text">{message}</span>
      </div>
    )
  }
}

export class Renderer extends Preact.Component {
  state: FeedbackRendererState = { feedback: [] }

  componentWillMount() {
    Provider.addListener("feedback", f => this.handleChange(f))
  }

  componentWillUnmount() {
    Provider.removeListener("feedback", f => this.handleChange(f))
  }

  handleChange = (feedbackData: FeedbackData) => {
    this.setState((prevState: FeedbackRendererState) => ({
      feedback: [...prevState.feedback, feedbackData],
    }))
    // filter this item out after two seconds
    delay(
      () =>
        this.setState((prevState: FeedbackRendererState) => ({
          feedback: prevState.feedback.filter(i => i.id != feedbackData.id),
        })),
      2000,
    )
  }

  render() {
    const feedback = this.state.feedback
    return (
      <div class="FeedbackContainer">
        {feedback.map(({ id, message, position }) => (
          <FeedbackItem
            key={id.toString()}
            id={id}
            message={message}
            position={position}
          />
        ))}
      </div>
    )
  }
}
