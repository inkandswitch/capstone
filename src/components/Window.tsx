import * as React from "react"
import Handler from "./Handler"

interface Props {
  onPointerMove?: (event: PointerEvent) => void
  onPointerUp?: (event: PointerEvent) => void
}

export default class Window extends Handler<Props> {
  render() {
    return null
  }

  componentDidMount() {
    window.addEventListener("pointermove", this.handle("onPointerMove"))
    window.addEventListener("pointerup", this.handle("onPointerUp"))
  }

  componentDidUnmount() {
    window.removeEventListener("pointermove", this.handle("onPointerMove"))
    window.removeEventListener("pointerup", this.handle("onPointerUp"))
  }
}
