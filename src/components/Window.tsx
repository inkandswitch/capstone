import * as React from "react"

interface Props {
  onPointerDown?: (event: React.PointerEvent) => void
}

export default class Window extends React.PureComponent<Props> {
  render() {
    return null
  }

  componentDidMount() {
    window.addEventListener("pointerdown", this.pointerDown)
  }

  componentDidUnmount() {
    window.removeEventListener("pointerdown", this.pointerDown)
  }

  pointerDown = event => {
    this.props.onPointerDown && this.props.onPointerDown(event)
  }
}
