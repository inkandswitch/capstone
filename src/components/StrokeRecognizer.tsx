import * as Preact from "preact"
import Handler from "./Handler"
import * as $P from "../modules/$P"
import Pen, { PenEvent } from "./Pen"
import { debounce } from "lodash"

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
  // TODO: list of valid patterns
}

const EMPTY_BOUNDS: Bounds = {
  top: Infinity,
  right: -Infinity,
  bottom: -Infinity,
  left: Infinity,
}

const DEFAULT_RECOGNIZER = new $P.Recognizer()

DEFAULT_RECOGNIZER.AddGesture("box", [
  new $P.Point(0, 0, 0),
  new $P.Point(0, 1, 0),
  new $P.Point(1, 1, 0),
  new $P.Point(1, 0, 0),
  new $P.Point(0, 0, 0),
])

DEFAULT_RECOGNIZER.AddGesture("X", [
  new $P.Point(30, 146, 1),
  new $P.Point(106, 222, 1),
  new $P.Point(30, 225, 2),
  new $P.Point(106, 146, 2),
])

export default class StrokeRecognizer extends Preact.Component<Props> {
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
      <Pen onMove={this.onMove} onUp={this.onUp}>
        {this.props.children}
      </Pen>
    )
  }

  onMove = ({ center: { x, y } }: PenEvent) => {
    this.points.push(new $P.Point(x, y, this.strokeId))
    this.updateBounds(x, y)
    this.recognize()
  }

  onUp = (event: PenEvent) => {
    this.strokeId += 1
  }

  _recognize = () => {
    const { maxScore = 0 } = this.props
    const result = this.recognizer.Recognize(this.points, this.props.only)

    if (result.Score > 0 && result.Score < maxScore) {
      console.log("score", result.Score)
      this.props.onStroke({
        name: result.Name,
        bounds: this.bounds,
        center: this.center(),
      })
    } else {
      console.log("Unrecognized stroke", result)
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
      left: Math.min(b.bottom, x),
    }
  }

  reset() {
    this.points = []
    this.strokeId = 0
    this.bounds = EMPTY_BOUNDS
  }
}
