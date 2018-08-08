import * as React from "react"
import Handler from "./Handler"
import Window from "./Window"

export interface Props {
  onDown?: (event: React.PointerEvent) => void
  onMove?: (event: React.PointerEvent) => void
  onUp?: (event: React.PointerEvent) => void
  children: JSX.Element
}

export default class Pen extends Handler<Props> {
  filter(event: React.PointerEvent) {
    return event.pointerType === "pen"
  }

  render() {
    return React.cloneElement(this.child, {
      onPointerDown: this.handle("onDown"),
      onPointerMove: this.handle("onMove"),
      onPointerUp: this.handle("onUp"),
    })
  }
}
