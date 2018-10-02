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

interface FeedbackItemProps {
  animationEnded: (id: number) => void
  feedbackData: FeedbackData
}

class FeedbackItem extends Preact.Component<FeedbackItemProps> {
  addCallback(el?: HTMLElement) {
    if (!el) {
      return
    }
    el.addEventListener("webkitAnimationEnd", () => {
      this.props.animationEnded(this.props.feedbackData.id)
    })
  }

  render() {
    const { message, position: { x = 0, y = 0 } = {} } = this.props.feedbackData
    if (!message) {
      return null
    }
    return (
      <div
        className="CommandFeedback"
        ref={(el: HTMLElement) => this.addCallback(el)}
        style={{ left: x, top: y }}>
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
  }

  animationEnded = (feedbackId: number) => {
    this.setState((prevState: FeedbackRendererState) => ({
      feedback: prevState.feedback.filter(i => i.id != feedbackId),
    }))
  }

  render() {
    const feedback = this.state.feedback
    return (
      <div class="FeedbackContainer">
        {feedback.map(feedbackData => (
          <FeedbackItem
            key={feedbackData.id.toString()}
            animationEnded={(id: number) => this.animationEnded(id)}
            feedbackData={feedbackData}
          />
        ))}
      </div>
    )
  }
}
