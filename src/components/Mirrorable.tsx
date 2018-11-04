import * as React from "react"
import * as ReactDOM from "react-dom"
import * as GPS from "gps"
import * as Rx from "rxjs"

export interface Props {
  cardId: string
  onMirror: (cardId: string) => void
}

export default class Mirrorable extends React.Component<Props> {
  node?: Element
  subscription?: Rx.Subscription

  componentDidMount() {
    // TODO: handle case where node is string
    this.node = ReactDOM.findDOMNode(this) as Element
    if (!this.node) return

    // TODO: use operators
    this.subscription = GPS.stream().subscribe(s => {
      // Has a touch on this target.
      const hasTouch = GPS.ifNotEmpty(
        GPS.onlyOnTarget(this.node!)(GPS.onlyTouch(s)),
      )
      if (!hasTouch) return

      // And has a pen on this target.
      const penOnTarget = GPS.toAnyPointer(
        GPS.onlyOnTarget(this.node!)(GPS.onlyPen(s)),
      )
      if (!penOnTarget) return

      this.onPen(GPS.toMostRecentEvent(penOnTarget))
    })
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onPen = (e: PointerEvent) => {
    if (e.type === "pointerdown") {
      this.props.onMirror(this.props.cardId)
    }
  }

  render() {
    return this.props.children
  }
}
