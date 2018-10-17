import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import { some } from "lodash"
import * as ReactDOM from "react-dom"
import * as PinchMetrics from "../logic/PinchMetrics"

interface NavigatableProps {
  onPinchInEnd?: () => void
  onPinchOutEnd?: () => void
  onPinchMove?: (distance: number) => void
}

interface State {
  pinch: PinchMetrics.Measurements
}

const MINIMUM_PINCH_TRAVEL = 40

export default class Navigatable extends React.Component<
  NavigatableProps,
  State
> {
  private node?: Element
  private subscription?: Rx.Subscription
  private pinchMetrics?: PinchMetrics.Measurements

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this) as Element
    if (!this.node) return

    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.map(GPS.onlyActive),
        RxOps.filter(GPS.ifExactlyTwo),
        RxOps.map(GPS.toMostRecentEvents),
      )
      .subscribe(this.onTwoFingers)
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onTwoFingers = (events: { [key: number]: PointerEvent }) => {
    if (!this.node) return

    const eventList = Object.values(events)

    if (
      !this.pinchMetrics &&
      this.node.contains(eventList[0].target as Node) &&
      this.node.contains(eventList[1].target as Node)
    ) {
      this.pinchMetrics = PinchMetrics.init(eventList)
    } else if (this.pinchMetrics) {
      if (some(events, GPS.ifTerminalEvent)) {
        const { delta } = this.pinchMetrics
        if (delta > MINIMUM_PINCH_TRAVEL) {
          this.props.onPinchOutEnd && this.props.onPinchOutEnd()
        } else if (delta < -MINIMUM_PINCH_TRAVEL) {
          this.props.onPinchInEnd && this.props.onPinchInEnd()
        }
        this.pinchMetrics = undefined
      } else {
        // Update pinch metrics
        this.pinchMetrics = PinchMetrics.update(this.pinchMetrics, eventList)
        this.props.onPinchMove &&
          this.props.onPinchMove(this.pinchMetrics.distance)
      }
    }
  }

  render() {
    return this.props.children
  }
}
