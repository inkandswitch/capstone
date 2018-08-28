import * as Preact from "preact"
import Handler from "./Handler"

import * as Hammer from "hammerjs"

export type PenEvent = HammerInput

interface Props {
  onDoubleTap?: (event: PenEvent) => void
  onMove?: (event: PenEvent) => void
  onUp?: (event: PenEvent) => void
}

export default class Pen extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onDoubleTap, onMove, onUp } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onDoubleTap) {
      recognizers.push([
        Hammer.Tap,
        { event: "doubletap", taps: 2, posThreshold: 20 },
      ])
    }

    if (onMove || onUp) {
      recognizers.push([Hammer.Pan, { direction: Hammer.DIRECTION_ALL }])
    }

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("doubletap", this.handle("onDoubleTap"))
    this.hammer.on("panmove", this.handle("onMove"))
    this.hammer.on("panend", this.handle("onUp"))
  }

  filter(event: PenEvent) {
    return event.pointerType === "pen"
  }

  render() {
    const { onDoubleTap, onMove, onUp, ...rest } = this.props
    return Preact.cloneElement(this.child, rest)
  }
}
