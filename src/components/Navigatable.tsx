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
  onDoubleTap?: () => void
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
  private pinchSubscription?: Rx.Subscription
  private doubleTapSubscription?: Rx.Subscription
  private pinchMetrics?: PinchMetrics.Measurements
  private lastPointerUpEvent?: PointerEvent

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this) as Element
    if (!this.node) return

    this.doubleTapSubscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.map(GPS.onlyActive),
        RxOps.filter(GPS.ifExactlyOne),
        RxOps.map(GPS.toAnyPointer),
        RxOps.map(GPS.toMostRecentEvent),
        RxOps.filter(GPS.ifPointerUpEvent),
      )
      .subscribe(this.onTap)

    this.pinchSubscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.map(GPS.onlyActive),
        RxOps.filter(GPS.ifExactlyTwo),
        RxOps.map(GPS.toMostRecentEvents),
      )
      .subscribe(this.onTwoFingers)
  }

  componentWillUnmount() {
    this.pinchSubscription && this.pinchSubscription.unsubscribe()
    this.doubleTapSubscription && this.doubleTapSubscription.unsubscribe()
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

  onTap = (e: PointerEvent) => {
    if (
      !this.props.onDoubleTap ||
      !this.node ||
      !this.node.contains(e.target as Node) ||
      this.pinchMetrics
    )
      return

    if (this.isDoubleTap(e)) {
      this.props.onDoubleTap()
      this.lastPointerUpEvent = undefined
    }
  }

  isDoubleTap = (e: PointerEvent) => {
    if (!this.lastPointerUpEvent) {
      this.lastPointerUpEvent = e
      return false
    }

    const last = this.lastPointerUpEvent
    this.lastPointerUpEvent = e

    const timePassed = e.timeStamp - last.timeStamp
    const distance = Math.sqrt(
      Math.pow(e.x - last.x, 2) + Math.pow(e.y - last.y, 2),
    )

    return timePassed < 500 && distance < 60
  }

  render() {
    return this.props.children
  }
}
