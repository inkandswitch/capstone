import * as React from "react"
import * as GPS from "../logic/GPS"
import * as RxOps from "rxjs/operators"
import * as css from "./css/EdgeBoardCreator.css"
import * as DragMetrics from "../logic/DragMetrics"

interface Props {
  onBoardCreate: (position: Point) => void
}

interface State {
  measurements?: DragMetrics.Measurements
}

const MINIMUM_DISTANCE = 60

export default class EdgeBoardCreator extends React.Component<Props, State> {
  leftEdge?: HTMLDivElement
  rightEdge?: HTMLDivElement

  state = { measurements: undefined }

  componentDidMount() {
    GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyPen),
        RxOps.filter(GPS.ifNotEmpty),
        RxOps.map(GPS.toAnyPointer),
        RxOps.map(GPS.toMostRecentEvent),
      )
      .subscribe(this.onPointerEvent)
  }

  onPointerEvent = (e: PointerEvent) => {
    if (!this.leftEdge || !this.rightEdge) return
    const { x, y } = e
    const { measurements } = this.state
    if (
      e.type === "pointerdown" &&
      (this.leftEdge.contains(e.target as Node) ||
        this.rightEdge.contains(e.target as Node))
    ) {
      this.setState({ measurements: DragMetrics.init({ x, y }) })
    } else if (measurements !== undefined) {
      if (e.type === "pointermove") {
        this.setState({
          measurements: DragMetrics.update(measurements, { x, y }),
        })
      } else {
        if (this.shouldCreateBoard()) {
          this.props.onBoardCreate(measurements.position)
          this.setState({ measurements: undefined })
        }
      }
    }
  }

  shouldCreateBoard() {
    const { measurements } = this.state
    return (
      measurements !== undefined && measurements.delta.x >= MINIMUM_DISTANCE
    )
  }

  onLeftEdge = (ref: HTMLDivElement) => {
    this.leftEdge = ref
  }

  onRightEdge = (ref: HTMLDivElement) => {
    this.rightEdge = ref
  }

  render() {
    const { measurements } = this.state
    let dragMarker = null
    if (measurements !== undefined) {
      const activated = measurements.delta.x >= MINIMUM_DISTANCE
      const style = {
        top: measurements.position.y,
        left: measurements.position.x,
        borderColor: activated ? "red" : "black",
      }
      dragMarker = <div className={css.Marker} style={style} />
    }
    return (
      <>
        <div className={css.LeftEdge} ref={this.onLeftEdge} />
        <div className={css.RightEdge} ref={this.onRightEdge} />
        {dragMarker}
        {this.props.children}
      </>
    )
  }
}
