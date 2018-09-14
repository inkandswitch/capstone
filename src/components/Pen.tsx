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
  shouldPreventPenScroll = false
  isPenActive = false

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

    // If we are handling pan events, prevent pen scroll.
    this.shouldPreventPenScroll = !!onPanMove
    const touchAction = this.shouldPreventPenScroll
      ? "auto"
      : Hammer.defaults.touchAction
    if (this.shouldPreventPenScroll) this.addPreventPenScrolListeners()

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
      touchAction,
    })
    this.hammer.on("doubletap", this.handle("onDoubleTap"))
    this.hammer.on("panmove", this.handle("onPanMove"))
    this.hammer.on("panend", this.handle("onPanEnd"))
  }

  componentWillUpdate() {
    if (this.shouldPreventPenScroll) this.removePreventPenScrollListeners()
  }

  componentDidUpdate() {
    if (this.shouldPreventPenScroll) this.addPreventPenScrolListeners()
  }

  componentWillUnmount() {
    this.hammer.destroy()
    if (this.shouldPreventPenScroll) this.removePreventPenScrollListeners()
  }

  addPreventPenScrolListeners() {
    if (!this.base) return
    this.base.addEventListener("pointerdown", this.onPointerDown)
    this.base.addEventListener("pointerup", this.onPointerUp)
    this.base.addEventListener("touchstart", this.onTouchStart)
  }

  removePreventPenScrollListeners() {
    if (!this.base) return
    this.base.removeEventListener("pointerdown", this.onPointerDown)
    this.base.removeEventListener("pointerup", this.onPointerUp)
    this.base.removeEventListener("pointercancel", this.onPointerCancel)
    this.base.removeEventListener("touchstart", this.onTouchStart)
  }

  onPointerDown = (event: PointerEvent) => {
    this.isPenActive = event.pointerType === "pen"
    if (this.base) this.base.setPointerCapture(event.pointerId)
  }

  onPointerUp = (event: PointerEvent) => {
    this.isPenActive = false
  }

  onPointerCancel = (event: PointerEvent) => {
    this.isPenActive = false
  }

  onTouchStart = (event: TouchEvent) => {
    if (this.shouldPreventPenScroll && this.isPenActive) event.preventDefault()
  }

  filter(event: PenEvent) {
    return event.pointerType === "pen"
  }

  render() {
    const { onDoubleTap, onPanMove, onPanEnd, ...rest } = this.props
    return Preact.cloneElement(this.child, rest)
  }
}
