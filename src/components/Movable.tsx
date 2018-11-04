import * as React from "react"
import { Subscription } from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "gps"

export type Ref = React.RefObject<HTMLDivElement>

interface Props {
  position?: Point
  onMoveEnd?: (position: Point) => void
  map?: (pt: Point) => Point
  children: (ref: Ref, info: State) => React.ReactNode
}

export interface State {
  position: Point
  isMoving: boolean
}

export default class Movable extends React.Component<Props, State> {
  ref: Ref = React.createRef()
  subscription?: Subscription
  offset?: Point
  state: State = {
    isMoving: false,
    position: this.props.position || { x: 0, y: 0 },
  }

  componentDidMount() {
    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.filter(GPS.ifNotEmpty),
        RxOps.map(GPS.toAnyPointer),
        RxOps.map(GPS.toMostRecentEvent),
      )
      .subscribe(this.onPointerEvent)
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onPointerEvent = (e: PointerEvent) => {
    const { map } = this.props
    const ref = this.ref.current
    if (!ref) return

    switch (e.type) {
      case "pointerdown": {
        if (!ref.contains(e.target as Node)) return
        this.offset = {
          x: e.screenX - this.state.position.x,
          y: e.screenY - this.state.position.y,
        }
        this.setState({ isMoving: true })
        break
      }

      case "pointermove":
        if (!this.state.isMoving || !this.offset) return
        let position = {
          x: e.screenX - this.offset.x,
          y: e.screenY - this.offset.y,
        }

        if (map) position = map(position)

        this.setState({ position })

        break

      case "pointerup":
      case "pointercancel":
        if (!this.state.isMoving) return

        this.offset = undefined
        this.props.onMoveEnd && this.props.onMoveEnd(this.state.position)
        this.setState({ isMoving: false })

        break
    }
  }

  render() {
    return this.props.children(this.ref, this.state)
  }
}
