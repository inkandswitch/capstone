import * as Preact from "preact"
import Handler from "./Handler"

import * as Hammer from "hammerjs"

export type PenEvent = HammerInput

interface Props {
  onDoubleTap?: (event: PenEvent) => void
  onPanMove?: (event: PenEvent) => void
  onPanEnd?: (event: PenEvent) => void
}

export default class Pen extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onDoubleTap, onPanMove, onPanEnd } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onDoubleTap) {
      recognizers.push([
        Hammer.Tap,
        { event: "doubletap", taps: 2, posThreshold: 20 },
      ])
    }

    if (onPanMove || onPanEnd) {
      recognizers.push([Hammer.Pan, { direction: Hammer.DIRECTION_ALL }])
    }

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("doubletap", this.handle("onDoubleTap"))
    this.hammer.on("panmove", this.handle("onPanMove"))
    this.hammer.on("panend", this.handle("onPanEnd"))
  }

  componentWillUnmount() {
    this.hammer.destroy()
  }

  filter(event: PenEvent) {
    return event.pointerType === "pen"
  }

  render() {
    const { onDoubleTap, onPanMove, onPanEnd, ...rest } = this.props
    return Preact.cloneElement(this.child, rest)
  }
}
