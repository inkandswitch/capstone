import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import * as ReactDOM from "react-dom"
import * as PinchMetrics from "../logic/PinchMetrics"

interface NavigatableProps {
  onPinchInEnd?: () => void
  onPinchOutEnd?: () => void
}

export default class Navigatable extends React.Component<NavigatableProps> {
  private node?: Element
  private subscription?: Rx.Subscription
  private pinchMetrics?: PinchMetrics.Measurements

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this) as Element
    if (!this.node) return

    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.filter(GPS.ifExactlyTwo),
        RxOps.map(GPS.toMostRecentEvents),
      )
      .subscribe(this.onTwoFingers)
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onTwoFingers = (events: { [key: number]: PointerEvent }) => {
    if (!this.pinchMetrics) {
      this.pinchMetrics = PinchMetrics.init(Object.values(events))
    }
    // if (!!this.node) return
    // if (!this.pinchStartDistance && pinchEvent.eventType != "pinchend") {
    //   for (const pointerEvent of pinchEvent.pointerEvents) {
    //     if (!this.node.contains(pointerEvent.target as Node)) return
    //   }
    //   this.pinchStartDistance = pinchEvent.distance
    // } else if (this.pinchStartDistance && pinchEvent.eventType == "pinchend") {
    //   if (this.pinchStartDistance > pinchEvent.distance) {
    //     this.props.onPinchOutEnd && this.props.onPinchOutEnd()
    //   } else if (this.pinchStartDistance < pinchEvent.distance) {
    //     this.props.onPinchInEnd && this.props.onPinchInEnd()
    //   }
    //   this.pinchStartDistance = undefined
    // }
  }

  render() {
    return <div>{this.props.children}</div>
  }
}
