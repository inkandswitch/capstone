import * as React from "react"
import * as GPS from "../logic/GPS"
import * as RxOps from "rxjs/operators"
import * as css from "./css/EdgeBoardCreator.css"
import * as boardCss from "./css/Board.css"
import * as DragMetrics from "../logic/DragMetrics"
import * as Rx from "rxjs"
import { CARD_DEFAULT_SIZE } from "../logic/SizeUtils"

interface Props {
  onBoardCreate: (position: Point) => void
  zIndex: number
}

interface State {
  measurements?: DragMetrics.Measurements
  thresholdMet: boolean
  triggeredEdge?: HTMLDivElement
}

const MINIMUM_DISTANCE = CARD_DEFAULT_SIZE.width / 2
const FADE_RANGE = 50

export default class EdgeBoardCreator extends React.Component<Props, State> {
  private leftEdge?: HTMLDivElement
  private rightEdge?: HTMLDivElement
  private rightEdgeMaxX?: number
  private subscription?: Rx.Subscription

  state: State = { thresholdMet: false }

  componentDidMount() {
    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyPen),
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
    if (!this.leftEdge || !this.rightEdge) return
    const { x, y } = e
    const { measurements } = this.state
    if (e.type === "pointerdown") {
      if (this.leftEdge.contains(e.target as Node)) {
        this.setState({
          measurements: DragMetrics.init({ x, y }),
          triggeredEdge: this.leftEdge,
        })
      } else if (this.rightEdge.contains(e.target as Node)) {
        this.setState({
          measurements: DragMetrics.init({ x, y }),
          triggeredEdge: this.rightEdge,
        })
      }
    } else if (measurements !== undefined) {
      if (e.type === "pointermove") {
        this.setState({
          measurements: DragMetrics.update(measurements, { x, y }),
          thresholdMet: this.shouldCreateBoard(),
        })
      } else {
        if (this.shouldCreateBoard()) {
          this.props.onBoardCreate(this.getBoardPosition())
        }
        this.setState({
          measurements: undefined,
          thresholdMet: false,
          triggeredEdge: undefined,
        })
      }
    }
  }

  getAbsoluteOffsetFromEdge() {
    const { measurements } = this.state
    if (!measurements || !this.state.triggeredEdge) return 0
    if (this.state.triggeredEdge == this.leftEdge) {
      return measurements.position.x
    } else if (
      this.state.triggeredEdge == this.rightEdge &&
      this.rightEdgeMaxX
    ) {
      return this.rightEdgeMaxX - measurements.position.x
    }
    return 0
  }

  shouldCreateBoard() {
    if (!this.state.thresholdMet) {
      this.setState({
        thresholdMet: this.getAbsoluteOffsetFromEdge() >= MINIMUM_DISTANCE,
      })
    }
    return this.state.thresholdMet
  }

  onLeftEdge = (ref: HTMLDivElement) => {
    this.leftEdge = ref
  }

  onRightEdge = (ref: HTMLDivElement) => {
    this.rightEdge = ref
    if (ref) {
      this.rightEdgeMaxX = ref.getBoundingClientRect().right
    }
  }

  getBoardPosition = () => {
    if (!this.state.measurements) return { x: 0, y: 0 }
    const translationX =
      this.state.triggeredEdge == this.leftEdge ? -CARD_DEFAULT_SIZE.width : 0
    return {
      x: this.state.measurements.position.x + translationX,
      y: this.state.measurements.position.y - CARD_DEFAULT_SIZE.height / 2,
    }
  }

  render() {
    const { measurements, thresholdMet } = this.state
    const { zIndex } = this.props
    let dragMarker = null
    let boardCard = null
    if (measurements && this.state.triggeredEdge) {
      const { position } = measurements
      const offsetFromEdge = this.getAbsoluteOffsetFromEdge()
      let cardOpacity = thresholdMet ? 1.0 : 0.5
      let shadowOpacity = thresholdMet ? 0.0 : 0.2
      if (!thresholdMet && offsetFromEdge > MINIMUM_DISTANCE - FADE_RANGE) {
        const pixelsPastFadeThreshold =
          offsetFromEdge - MINIMUM_DISTANCE + FADE_RANGE
        cardOpacity = 0.5 + (0.5 / FADE_RANGE) * pixelsPastFadeThreshold
        shadowOpacity = 0.2 + (-0.2 / FADE_RANGE) * pixelsPastFadeThreshold
      }
      const dragMarkerStyle = {
        transform: `translate(${position.x - 10}px,${position.y - 10}px)`,
        zIndex,
      }

      const shadowOffsetX =
        this.state.triggeredEdge == this.leftEdge ? "-3px" : "3px"
      const boardPosition = this.getBoardPosition()
      const boardCardStyle = {
        boxShadow: `${shadowOffsetX} 3px 8px rgba(0, 0, 0, ${shadowOpacity})`,
        opacity: cardOpacity,
        width: CARD_DEFAULT_SIZE.width,
        height: CARD_DEFAULT_SIZE.height,
        transform: `translate(${boardPosition.x}px,${boardPosition.y}px)`,
        zIndex,
      }
      dragMarker = <div className={css.Marker} style={dragMarkerStyle} />
      boardCard = (
        <div className={boardCss.BoardEmbedBackground} style={boardCardStyle} />
      )
    }
    return (
      <>
        <div className={css.LeftEdge} ref={this.onLeftEdge} />
        <div className={css.RightEdge} ref={this.onRightEdge} />
        {boardCard}
        {dragMarker}
        {this.props.children}
      </>
    )
  }
}
