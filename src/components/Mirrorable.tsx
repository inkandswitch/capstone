import * as React from "react"
import * as ReactDOM from "react-dom"
import * as GPS from "../logic/GPS"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"

export interface Props {
  cardId: string
  onMirror: (cardId: string) => void
}

export default class Mirrorable extends React.Component<Props> {
  ref?: Element
  subscription?: Rx.Subscription

  componentDidMount() {
    this.ref = ReactDOM.findDOMNode(this) as Element
    if (!this.ref) return

    this.subscription = GPS.stream()
      .pipe(
        RxOps.filter(s => {
          const hasTouch = GPS.ifNotEmpty(GPS.onlyTouch(s))
          const hasPenOnTarget = GPS.ifNotEmpty(
            GPS.onlyOnTarget(this.ref as HTMLElement)(GPS.onlyPen(s)),
          )
          return hasTouch && hasPenOnTarget
        }),
        RxOps.map(GPS.onlyPen),
        RxOps.map(GPS.onlyOnTarget(this.ref as HTMLElement)),
        RxOps.map(GPS.toAnyPointer),
      )
      .subscribe(this.onPen)
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
