import * as Preact from "preact"
import Handler from "./Handler"
import * as $P from "../modules/$P"
import Pen from "./Pen"
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
}

export interface Props {
  onStroke: (stroke: Stroke) => void
  delay?: number
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

export default class StrokeRecognizer extends Preact.Component<Props> {
  static defaultProps = {
    delay: 200,
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

  onMove = ({ x, y }: PointerEvent) => {
    this.points.push(new $P.Point(x, y, this.strokeId))
    this.updateBounds(x, y)
    this.recognize()
  }

  onUp = (event: PointerEvent) => {
    this.strokeId += 1
  }

  _recognize = () => {
    const result = this.recognizer.Recognize(this.points)

    if (result.Score > 0) {
      this.props.onStroke({
        name: result.Name,
        bounds: this.bounds,
      })
    } else {
      console.log("Unrecognized stroke", result)
    }

    this.reset()
  }

  recognize = debounce(this._recognize, this.props.delay)

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
