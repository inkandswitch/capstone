import * as Preact from "preact"
import Handler from "./Handler"
import * as Hammer from "hammerjs"

export type TouchEvent = HammerInput

interface Props {
  onPinchEnd?: (event: TouchEvent) => void
  onTap?: (event: TouchEvent) => void
  // TODO: add other gesture recognizers
}

export default class Touch extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onPinchEnd, onTap } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onPinchEnd) recognizers.push([Hammer.Pinch, { threshold: 0.5 }])
    if (onTap) recognizers.push([Hammer.Tap])

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("pinchend", this.handle("onPinchEnd"))
    this.hammer.on("tap", this.handle("onTap"))
  }

  filter(event: TouchEvent) {
    return event.pointerType !== "pen"
  }

  render() {
    const { onPinchEnd, onTap, ...rest } = this.props
    return Preact.cloneElement(this.child, rest)
  }
}