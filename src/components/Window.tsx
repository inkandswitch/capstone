import * as React from "react"

interface Props {
  onPointerDown?: (event: PointerEvent) => void
}

export default class Window extends React.Component<Props> {
  render() {
    return null
  }

  componentDidMount() {
    window.addEventListener("pointerdown", this.pointerDown)
  }

  componentDidUnmount() {
    window.removeEventListener("pointerdown", this.pointerDown)
  }

  pointerDown = (event: PointerEvent) => {
    this.props.onPointerDown && this.props.onPointerDown(event)
  }
}
