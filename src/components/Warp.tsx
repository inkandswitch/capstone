import * as React from "react"
import { createPortal } from "react-dom"

interface Props {
  to?: Element | null
  children: React.ReactNode
}

// Works like a "Portal", but can be moved around during render without
// remounting the children.
export default class Warp extends React.Component<Props> {
  root = document.createElement("div")
  ref: Element | null = null

  componentDidMount() {
    this.forceUpdate()
  }

  componentDidUpdate(nProps: Props) {
    if (nProps.to) {
      nProps.to.appendChild(this.root)
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
