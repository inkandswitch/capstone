import * as React from "react"
import { createPortal } from "react-dom"

interface Props {
  to?: Element | null
  children: React.ReactNode
}

// Works like a normal "portal", but can be moved around during render without
// remounting the children.
export default class Warp extends React.Component<Props> {
  root = document.createElement("div")
  ref: Element | null = null

  componentDidMount() {
    this.calculateRoot()
  }

  componentDidUpdate() {
    this.calculateRoot()
  }

  calculateRoot() {
    const { to } = this.props

    if (to) {
      to.appendChild(this.root)
    } else {
      this.ref!.appendChild(this.root)
    }
  }

  render() {
    return (
      <>
        <div ref={el => (this.ref = el)} />
        {createPortal(this.props.children, this.root)}
      </>
    )
  }
}
