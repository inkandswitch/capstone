import * as Preact from "preact"
import Handler from "./Handler"
import * as Hammer from "hammerjs"

export type PenEvent = HammerInput

interface Props {
  onDoubleTap?: (event: PenEvent) => void
}

export default class Pen extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onDoubleTap } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onDoubleTap) {
      recognizers.push([
        Hammer.Tap,
        { event: "doubletap", taps: 2, posThreshold: 20 },
      ])
    }

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("doubletap", this.handle("onDoubleTap"))
  }

  filter(event: PenEvent) {
    return event.pointerType === "pen"
  }

  render() {
    const { onDoubleTap, ...rest } = this.props
    return Preact.cloneElement(this.child, rest)
  }
}
