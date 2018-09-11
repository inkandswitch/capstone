import * as Preact from "preact"
import Handler from "./Handler"
import * as $P from "../modules/$P"
import Pen, { PenEvent } from "./Pen"
import { debounce } from "lodash"
import Portal from "preact-portal"
import "../styles/styles.css"

interface Bounds {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface Stroke {
  name: string
  bounds: Bounds
  center: { x: number; y: number }
}

export interface Props {
  onStroke: (stroke: Stroke) => void
  delay?: number
  maxScore?: number
  only?: string[]
  children: JSX.Element
}

export interface State {
  isTracking: boolean
}

const EMPTY_BOUNDS: Bounds = {
  top: Infinity,
  right: -Infinity,
  bottom: -Infinity,
  left: Infinity,
}

const DEFAULT_RECOGNIZER = new $P.Recognizer()

DEFAULT_RECOGNIZER.AddGesture("box", [
  new $P.Point(0, 0, 1),
  new $P.Point(0, 1, 1),
  new $P.Point(1, 1, 1),
  new $P.Point(1, 0, 1),
  new $P.Point(0, 0, 1),
])

DEFAULT_RECOGNIZER.AddGesture("X", [
  new $P.Point(30, 146, 1),
  new $P.Point(106, 222, 1),
  new $P.Point(30, 225, 2),
  new $P.Point(106, 146, 2),
])

DEFAULT_RECOGNIZER.AddGesture("downarrow", [
  new $P.Point(0, 0, 1),
  new $P.Point(1, 1, 1),
  new $P.Point(2, 0, 1),
])

DEFAULT_RECOGNIZER.AddGesture("uparrow", [
  new $P.Point(0, 1, 1),
  new $P.Point(1, 0, 1),
  new $P.Point(2, 1, 1),
])

export default class StrokeRecognizer extends Preact.Component<Props, State> {
  canvasElement?: HTMLCanvasElement

  static defaultProps = {
    delay: 200,
    maxScore: 6,
  }

  recognizer: $P.Recognizer = DEFAULT_RECOGNIZER
  points: $P.Point[] = []
  strokeId = 0
  bounds: Bounds = EMPTY_BOUNDS

  render() {
    return (
      <div>
        <Pen onPanMove={this.onPanMove} onPanEnd={this.onPanEnd}>
          {this.props.children}
        </Pen>
        {this.state.isTracking ? (
          <Portal into="body">
            <canvas
              width={window.innerWidth}
              height={window.innerHeight}
              ref={(el: HTMLCanvasElement) => (this.canvasElement = el)}
              class="StrokeLayer"
            />
          </Portal>
        ) : null}
      </div>
    )
  }

  onPanMove = ({ center: { x, y } }: PenEvent) => {
    this.setState({ isTracking: true })
    this.points.push(new $P.Point(x, y, this.strokeId))
    this.updateBounds(x, y)
    this.drawStroke()
  }

  onPanEnd = (event: PenEvent) => {
    this.setState({ isTracking: false })
    this.strokeId += 1
    this.recognize()
  }

  _recognize = () => {
    const { maxScore = 0, only } = this.props
    const result = this.recognizer.Recognize(this.points, only)

    if (result.Score > 0 && result.Score < maxScore) {
      this.props.onStroke({
        name: result.Name,
        bounds: this.bounds,
        center: this.center(),
      })
    } else {
      // console.log("Unrecognized stroke", result)
    }

    this.reset()
  }

  recognize = debounce(this._recognize, this.props.delay)

  center() {
    const b = this.bounds
    return {
      x: (b.left + b.right) / 2,
      y: (b.top + b.bottom) / 2,
    }
  }

  updateBounds(x: number, y: number) {
    const b = this.bounds
    this.bounds = {
      top: Math.min(b.top, y),
      right: Math.max(b.right, x),
      bottom: Math.max(b.bottom, y),
      left: Math.min(b.left, x),
    }
  }

  reset() {
    this.points = []
    this.strokeId = 0
    this.bounds = EMPTY_BOUNDS

    const ctx = this.getDrawingContext()
    if (!ctx) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }

  getDrawingContext(): CanvasRenderingContext2D | null | undefined {
    return this.canvasElement && this.canvasElement.getContext("2d")
  }

  drawStroke() {
    const ctx = this.getDrawingContext()
    if (!ctx || this.points.length == 0) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.beginPath()
    ctx.lineWidth = 4
    const startPoint = this.points[0]
    for (let i = 0; i < this.points.length; i++) {
      let point = this.points[i]
      i == 0 ? ctx.moveTo(point.X, point.Y) : ctx.lineTo(point.X, point.Y)
    }
    ctx.stroke()
  }
}
