import * as Preact from "preact"
import Handler from "./Handler"
import * as Hammer from "hammerjs"

interface Props {
  onPinchEnd?: (event: HammerInput) => void
  // TODO: add other gesture recognizers
}

export default class Gesture extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onPinchEnd } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onPinchEnd) recognizers.push([Hammer.Pinch, { threshold: 0.5 }])

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("pinchend", this.handle("onPinchEnd"))
  }

  render() {
    return this.child
  }
}
