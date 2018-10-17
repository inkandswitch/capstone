import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import * as ReactDOM from "react-dom"

interface NavigatableProps {
  onPinchInEnd?: () => void
  onPinchOutEnd?: () => void
}

export default class Navigatable extends React.Component<NavigatableProps> {
  private node?: Element
  private subscription?: Rx.Subscription
  private pinchStartDistance?: number

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this) as Element
    if (!this.node) return

    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.filter(GPS.ifTwoFingerPinch),
        RxOps.map(GPS.toPinchEvent),
      )
      .subscribe(this.onPinch)
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onPinch = (pinchEvent?: GPS.PinchEvent) => {
    if (!pinchEvent || !this.node) return
    if (!this.pinchStartDistance && pinchEvent.eventType != "pinchend") {
      for (const pointerEvent of pinchEvent.pointerEvents) {
        if (!this.node.contains(pointerEvent.target as Node)) return
      }
      this.pinchStartDistance = pinchEvent.distance
    } else if (this.pinchStartDistance && pinchEvent.eventType == "pinchend") {
      if (this.pinchStartDistance > pinchEvent.distance) {
        this.props.onPinchOutEnd && this.props.onPinchOutEnd()
      } else if (this.pinchStartDistance < pinchEvent.distance) {
        this.props.onPinchInEnd && this.props.onPinchInEnd()
      }
      this.pinchStartDistance = undefined
    }
  }

  render() {
    return <div>{this.props.children}</div>
  }
}
