import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import { some } from "lodash"
import * as ReactDOM from "react-dom"
import * as PinchMetrics from "../logic/PinchMetrics"

interface NavigatableProps {
  onPinchStart?: (measurements: PinchMetrics.Measurements) => void
  onPinchMove?: (measurements: PinchMetrics.Measurements) => void
  onPinchInEnd?: (measurements: PinchMetrics.Measurements) => void
  onPinchOutEnd?: (measurements: PinchMetrics.Measurements) => void
}

interface State {
  pinch?: PinchMetrics.Measurements
}

const MINIMUM_PINCH_TRAVEL = 40

export default class Pinchable extends React.Component<
  NavigatableProps,
  State
> {
  private node?: Element
  private subscription?: Rx.Subscription

  state: State = { pinch: undefined }

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
        const { scale, delta } = pinch
        if (scale > 1 && delta > MINIMUM_PINCH_TRAVEL) {
          this.props.onPinchOutEnd && this.props.onPinchOutEnd(pinch)
        } else if (scale < 1 && delta < -MINIMUM_PINCH_TRAVEL) {
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

  render() {
    return this.props.children
  }
}
