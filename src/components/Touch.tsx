import * as Preact from "preact"
import Handler from "./Handler"
import * as Hammer from "hammerjs"

export type TouchEvent = HammerInput

// TODO: Develop better way to define and configure recognizers - without exposing
// hammer internals.
interface Props {
  onPinchEnd?: (event: TouchEvent) => void
  onTap?: (event: TouchEvent) => void
  onDoubleTap?: (event: TouchEvent) => void
  onThreeFingerSwipeDown?: (event: TouchEvent) => void
  onThreeFingerSwipeUp?: (event: TouchEvent) => void
  // TODO: add other gesture recognizers
}

export default class Touch extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const {
      onPinchEnd,
      onTap,
      onDoubleTap,
      onThreeFingerSwipeDown,
      onThreeFingerSwipeUp,
    } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onPinchEnd) recognizers.push([Hammer.Pinch, { threshold: 0.5 }])
    if (onTap) recognizers.push([Hammer.Tap])
    if (onDoubleTap)
      recognizers.push([
        Hammer.Tap,
        { event: "doubletap", taps: 2, posThreshold: 40 },
      ])
    if (onThreeFingerSwipeDown) {
      recognizers.push([
        Hammer.Swipe,
        {
          event: "threeFingerSwipeDown",
          pointers: 3,
          direction: Hammer.DIRECTION_DOWN,
        },
      ])
    }
    if (onThreeFingerSwipeUp) {
      recognizers.push([
        Hammer.Swipe,
        {
          event: "threeFingerSwipeUp",
          pointers: 3,
          direction: Hammer.DIRECTION_UP,
        },
      ])
    }

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("pinchend", this.handle("onPinchEnd"))
    this.hammer.on("tap", this.handle("onTap"))
    this.hammer.on("doubletap", this.handle("onDoubleTap"))
    this.hammer.on(
      "threeFingerSwipeDown",
      this.handle("onThreeFingerSwipeDown"),
    )
    this.hammer.on("threeFingerSwipeUp", this.handle("onThreeFingerSwipeUp"))
  }

  componentWillUnmount() {
    this.hammer.destroy()
  }

  filter(event: TouchEvent) {
    return event.pointerType !== "pen" && !event.srcEvent.shiftKey
  }

  render() {
    const {
      onPinchEnd,
      onTap,
      onDoubleTap,
      onThreeFingerSwipeDown,
      onThreeFingerSwipeUp,
      ...rest
    } = this.props
    return Preact.cloneElement(this.child, rest)
  }
}
