import * as React from "react"
import * as GPS from "../logic/GPS"
import * as RxOps from "rxjs/operators"
import * as css from "./css/EdgeBoardCreator.css"
import * as DragMetrics from "../logic/DragMetrics"

interface Props {
  onBoardCreate: (position: Point) => void
}

interface State {
  metrics?: DragMetrics.Metrics
}

const MINIMUM_DISTANCE = 60

export default class EdgeBoardCreator extends React.Component<Props, State> {
  leftEdge?: HTMLDivElement
  rightEdge?: HTMLDivElement

  state = { metrics: undefined }

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
    const metrics = this.state.metrics
    if (
      e.type === "pointerdown" &&
      (this.leftEdge.contains(e.target as Node) ||
        this.rightEdge.contains(e.target as Node))
    ) {
      this.setState({ metrics: DragMetrics.init({ x, y }) })
    } else if (metrics !== undefined) {
      if (e.type === "pointermove") {
        this.setState({ metrics: DragMetrics.update(metrics, { x, y }) })
      } else {
        if (this.shouldCreateBoard()) {
          this.props.onBoardCreate(metrics.position)
          this.setState({ metrics: undefined })
        }
      }
    }
  }

  shouldCreateBoard() {
    const { metrics } = this.state
    return metrics !== undefined && metrics.delta.x >= MINIMUM_DISTANCE
  }

  onLeftEdge = (ref: HTMLDivElement) => {
    this.leftEdge = ref
  }

  onRightEdge = (ref: HTMLDivElement) => {
    this.rightEdge = ref
  }

  render() {
    const metrics = this.state.metrics
    let dragMarker = null
    if (metrics !== undefined) {
      const activated = metrics.delta.x >= MINIMUM_DISTANCE
      const style = {
        top: metrics.position.y,
        left: metrics.position.x,
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
