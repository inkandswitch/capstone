import * as Preact from "preact"
import Handler from "./Handler"
import * as Hammer from "hammerjs"

interface Props {
  onPinch?: (event: HammerInput) => void
}

export default class Gesture extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onPinch } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onPinch) recognizers.push([Hammer.Pinch, { threshold: 0.5 }])

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("pinchend", this.handle("onPinch"))
  }

  render() {
    return this.child
  }
}
