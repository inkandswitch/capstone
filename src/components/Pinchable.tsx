import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "gps"
import { some } from "lodash"
import * as ReactDOM from "react-dom"
import * as PinchMetrics from "../logic/PinchMetrics"

interface NavigatableProps {
  onPinchStart?: (measurements: PinchMetrics.Measurements) => void
  onPinchMove?: (measurements: PinchMetrics.Measurements) => void
  onPinchInEnd?: (measurements: PinchMetrics.Measurements) => void
  onPinchOutEnd?: (measurements: PinchMetrics.Measurements) => void
  onDoubleTap?: () => void
}

interface State {
  pinch?: PinchMetrics.Measurements
}

export default class Pinchable extends React.Component<
  NavigatableProps,
  State
> {
  private node?: Element
  state: State = { pinch: undefined }
  private pinchSubscription?: Rx.Subscription
  private doubleTapSubscription?: Rx.Subscription
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
    const { pinch } = this.state

    if (
      !pinch &&
      this.node.contains(eventList[0].target as Node) &&
      this.node.contains(eventList[1].target as Node)
    ) {
      const pinch = PinchMetrics.init(eventList)
      this.setState({ pinch })
      this.props.onPinchStart && this.props.onPinchStart(pinch)
    } else if (pinch) {
      if (some(events, GPS.ifTerminalEvent)) {
        const { scale } = pinch
        if (scale > 1) {
          this.props.onPinchOutEnd && this.props.onPinchOutEnd(pinch)
        } else if (scale < 1) {
          this.props.onPinchInEnd && this.props.onPinchInEnd(pinch)
        }
        this.setState({ pinch: undefined })
      } else {
        // Update pinch metrics
        const updatedPinch = PinchMetrics.update(pinch, eventList)
        this.setState({ pinch: updatedPinch })
        this.props.onPinchMove && this.props.onPinchMove(updatedPinch)
      }
    }
  }

  onTap = (e: PointerEvent) => {
    if (
      !this.props.onDoubleTap ||
      !this.node ||
      !this.node.contains(e.target as Node) ||
      this.state.pinch
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
