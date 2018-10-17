import * as React from "react"
import * as GPS from "../logic/GPS"
import * as RxOps from "rxjs/operators"
import * as css from "./css/EdgeBoardCreator.css"

interface Props {
  onBoardCreate: (position: Point) => void
}

interface State {
  dragMarker: Point | undefined
}

export default class EdgeBoardCreator extends React.Component<Props, State> {
  leftEdge?: HTMLDivElement
  rightEdge?: HTMLDivElement

  state = { dragMarker: undefined }

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
    const dragMarker = this.state.dragMarker
    if (e.type === "pointerdown" && this.leftEdge.contains(e.target as Node)) {
      this.setState({ dragMarker: { x: e.x, y: e.y } })
    } else if (dragMarker) {
      if (e.type === "pointermove") {
        this.setState({ dragMarker: { x: e.x, y: e.y } })
      } else {
        this.props.onBoardCreate(dragMarker)
        this.setState({ dragMarker: undefined })
      }
    }
  }

  onLeftEdge = (ref: HTMLDivElement) => {
    this.leftEdge = ref
  }

  onRightEdge = (ref: HTMLDivElement) => {
    this.rightEdge = ref
  }

  render() {
    const pos = this.state.dragMarker
    return (
      <>
        <div className={css.LeftEdge} ref={this.onLeftEdge} />
        <div className={css.RightEdge} ref={this.onRightEdge} />
        {pos !== undefined ? (
          <div className={css.Marker} style={{ top: pos.y, left: pos.x }} />
        ) : null}
        {this.props.children}
      </>
    )
  }
}
