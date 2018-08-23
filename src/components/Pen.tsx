import * as Preact from "preact"
import Handler from "./Handler"
import Window from "./Window"

export interface Props {
  onDown?: (event: PointerEvent) => void
  onMove?: (event: PointerEvent) => void
  onUp?: (event: PointerEvent) => void
}

export default class Pen extends Handler<Props> {
  filter(event: PointerEvent) {
    return event.pointerType === "pen"
  }

  render() {
    return Preact.cloneElement(this.child, {
      onPointerDown: this.handle("onDown"),

      // TODO: bind these on window after receiving onDown:
      onPointerMove: this.handle("onMove"),
      onPointerUp: this.handle("onUp"),
    })
  }
}
