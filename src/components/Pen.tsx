import * as React from "react"
import Handler from "./Handler"

import * as Hammer from "hammerjs"

export type PenEvent = HammerInput

interface Props {
  onDoubleTap?: (event: PenEvent) => void
  onPanStart?: (event: PenEvent) => void
  onPanMove?: (event: PenEvent) => void
  onPanEnd?: (event: PenEvent) => void
}

export default class Pen extends Handler<Props> {
  ref?: HTMLElement
  hammer: HammerManager
  shouldPreventPenScroll = false
  isPenActive = false

  componentDidMount() {
    if (!this.ref) return
    const { onDoubleTap, onPanMove, onPanEnd } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onDoubleTap) {
      recognizers.push([
        Hammer.Tap,
        { event: "doubletap", taps: 2, posThreshold: 20 },
      ])
    }

    if (onPanMove || onPanEnd) {
      recognizers.push([
        Hammer.Pan,
        { threshold: 0, direction: Hammer.DIRECTION_ALL },
      ])
    }

    // If we are handling pan events, prevent pen scroll.
    this.shouldPreventPenScroll = !!onPanMove
    const touchAction = this.shouldPreventPenScroll
      ? "auto"
      : Hammer.defaults.touchAction
    if (this.shouldPreventPenScroll) this.addPreventPenScrolListeners()

    this.hammer = new Hammer.Manager(this.ref, {
      recognizers,
      touchAction,
    })
    this.hammer.on("doubletap", this.handle("onDoubleTap"))
    this.hammer.on("panstart", this.handle("onPanStart"))
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
    if (!this.ref) return
    this.ref.addEventListener("pointerdown", this.onPointerDown)
    this.ref.addEventListener("pointerup", this.onPointerUp)
    this.ref.addEventListener("pointercancel", this.onPointerCancel)
    this.ref.addEventListener("touchstart", this.onTouchStart)
  }

  removePreventPenScrollListeners() {
    if (!this.ref) return
    this.ref.removeEventListener("pointerdown", this.onPointerDown)
    this.ref.removeEventListener("pointerup", this.onPointerUp)
    this.ref.removeEventListener("pointercancel", this.onPointerCancel)
    this.ref.removeEventListener("touchstart", this.onTouchStart)
  }

  onPointerDown = (event: PointerEvent) => {
    this.isPenActive = event.pointerType === "pen"
    if (this.ref) this.ref.setPointerCapture(event.pointerId)
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
    return event.pointerType === "pen" || event.srcEvent.shiftKey
  }

  onRef(ref: HTMLElement) {
    this.ref = ref
  }

  render() {
    if (!this.child || !React.isValidElement(this.child)) {
      return null
    }

    const { onDoubleTap, onPanMove, onPanEnd, ref: onRef, ...rest } = this.props
    return React.cloneElement(this.child, rest)
  }
}
