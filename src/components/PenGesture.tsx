import * as Preact from "preact"
import Handler from "./Handler"
import * as Hammer from "hammerjs"

interface Props {
  onDoubleTap?: (event: PointerEvent) => void
}

export default class PenGesture extends Handler<Props> {
  hammer: HammerManager

  componentDidMount() {
    if (!this.base) return

    const { onDoubleTap } = this.props

    const recognizers: RecognizerTuple[] = []

    if (onDoubleTap) {
      recognizers.push([Hammer.Tap, { event: "doubletap", taps: 2 }])
    }

    this.hammer = new Hammer.Manager(this.base, {
      recognizers,
    })
    this.hammer.on("doubletap", (e: HammerInput) => {
      if (e.pointerType !== "pen") return
      this.handle("onDoubleTap")(e.srcEvent)
    })
  }

  render() {
    return this.child
  }
}
