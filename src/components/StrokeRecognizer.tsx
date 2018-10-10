import * as React from "react"
import * as $P from "../modules/$P"
import * as Rx from "rxjs"
import * as Glyph from "../data/Glyph"
import * as Frame from "../logic/Frame"
import classnames from "classnames"
import * as css from "./css/StrokeRecognizer.css"
import * as Feedback from "./CommandFeedback"
import { Portal } from "react-portal"
import * as GPS from "./GPS"
import { filter } from "rxjs/operators"
const templates = require("../modules/$P/glyph-templates.json")

interface Bounds {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface PenPoint {
  x: number
  y: number
  pressure: number
}

export interface GlyphEvent {
  glyph: Glyph.Glyph
  name: string
  bounds: Bounds
  center: { x: number; y: number }
}

export interface InkStrokeEvent {
  points: PenPoint[]
  settings: StrokeSettings
}

export function penPointFrom(pointString: string): PenPoint | undefined {
  const arr = pointString.split("/")
  if (arr.length < 3) return
  return {
    x: parseFloat(arr[0]),
    y: parseFloat(arr[1]),
    pressure: parseFloat(arr[2]),
  }
}

export interface Props {
  onGlyph?: (stroke: GlyphEvent) => void
  onInkStroke?: (strokes: InkStrokeEvent[]) => void
  delay?: number
  maxScore?: number
  only?: string[]
  style?: {}
  children: JSX.Element
}

const EMPTY_BOUNDS: Bounds = {
  top: Infinity,
  right: -Infinity,
  bottom: -Infinity,
  left: Infinity,
}

enum StrokeType {
  ink,
  erase,
  default = ink,
}

export interface StrokeSettings {
  readonly globalCompositeOperation: string
  readonly strokeStyle: string
  readonly lineCap: string
  readonly lineJoin: string
  readonly maxLineWith: number
  lineWidth: number
}

export const StrokeWidth = (pressure: number, maxWidth: number) => {
  return Math.max(1, maxWidth * Math.pow(pressure, 4))
}

const StrokeSettings: { [st: number]: StrokeSettings } = {
  [StrokeType.ink]: {
    globalCompositeOperation: "source-over",
    strokeStyle: "black",
    lineCap: "round",
    lineJoin: "round",
    maxLineWith: 16,
    lineWidth: 16,
  },
  [StrokeType.erase]: {
    globalCompositeOperation: "source-over",
    strokeStyle: "white",
    lineCap: "round",
    lineJoin: "round",
    maxLineWith: 40,
    lineWidth: 40,
  },
}

const $P_RECOGNIZER = new $P.Recognizer()

// Initializer recognizer with default gestures.
;(function initializeRecognizer() {
  for (const name in templates) {
    const mappedPoints = templates[name].map((point: any) => {
      return new $P.Point(point.x, point.y, point.id)
    })
    $P_RECOGNIZER.AddGesture(name, mappedPoints)
  }
})()

interface State {
  strokeType?: StrokeType
}

export default class StrokeRecognizer extends React.Component<Props, State> {
  canvasElement?: HTMLCanvasElement | null
  ctx?: CanvasRenderingContext2D | null
  isPenDown: boolean = false
  static strokeTypeSubect: Rx.Subject<StrokeType> = new Rx.Subject()
  subscription?: Rx.Subscription
  pointerEventSubscription?: Rx.Subscription

  static defaultProps = {
    delay: 300,
    maxScore: 6,
  }

  recognizer: $P.Recognizer = $P_RECOGNIZER
  strokes: PenPoint[][] = []
  strokeId = 0
  lastDrawnPoint = 0
  bounds: Bounds = EMPTY_BOUNDS

  state = { strokeType: undefined }

  render() {
    const { strokeType } = this.state
    const style = this.props.style || {}

    return (
      <div style={style}>
        {this.props.children}
        <Portal>
          <div>
            <canvas ref={this.canvasAdded} className={css.StrokeLayer} />
            <div className={css.Options}>
              <Option
                label="Ink"
                value={StrokeType.ink}
                selected={strokeType === StrokeType.ink}
                onChange={this.onStrokeTypeChange}
              />
              <Option
                label="Erase"
                value={StrokeType.erase}
                selected={strokeType === StrokeType.erase}
                onChange={this.onStrokeTypeChange}
              />
            </div>
          </div>
        </Portal>
      </div>
    )
  }

  componentDidMount() {
    this.pointerEventSubscription =
      GPS.Provider.events$ &&
      GPS.Provider.events$
        .pipe(filter(e => e.pointerType === "pen" || e.shiftKey))
        .subscribe(this.onPenEvent)
    this.subscription = StrokeRecognizer.strokeTypeSubect.subscribe(
      strokeType => {
        this.setState({ strokeType })
      },
    )
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
    this.pointerEventSubscription && this.pointerEventSubscription.unsubscribe()
  }

  onPenEvent = (event: PointerEvent) => {
    if (this.state.strokeType === undefined) return
    if (event.type == "pointerdown") {
      this.onPanStart(event)
    } else if (event.type == "pointerup" || event.type == "pointercancel") {
      this.onPanEnd(event)
    } else if (event.type == "pointermove") {
      this.onPanMove(event)
    }
  }

  onPanStart = (event: PointerEvent) => {
    this.onPanMove(event)
  }

  onPanMove = (event: PointerEvent) => {
    const { x, y } = event
    if (!this.isPenDown) this.isPenDown = true
    const coalesced: PointerEvent[] = event.getCoalescedEvents()
    if (!this.strokes[this.strokeId]) {
      this.strokes[this.strokeId] = []
    }
    this.strokes[this.strokeId].push(
      ...coalesced.map((value, i, a) => {
        return {
          x: value.x,
          y: value.y,
          pressure: value.pressure,
        }
      }),
    )

    this.updateBounds(x, y)
    this.draw()
  }

  onPanEnd = (event: PointerEvent) => {
    if (this.isPenDown) this.isPenDown = false
    this.strokeId += 1
    this.lastDrawnPoint = 0
  }

  inkStroke = () => {
    if (!this.props.onInkStroke || this.state.strokeType == undefined) {
      return
    }
    this.props.onInkStroke(
      this.strokes.map((points, i, a) => {
        return {
          points: points,
          settings: StrokeSettings[this.state.strokeType!],
        }
      }),
    )
  }

  onStrokeTypeChange = (strokeType?: StrokeType) => {
    if (this.state.strokeType === strokeType) return
    this.inkStroke()
    this.reset()
    this.setState({ strokeType }, () => {
      StrokeRecognizer.strokeTypeSubect.next(strokeType)
    })
  }

  _recognize = () => {
    if (this.isPenDown) return
    if (!this.props.onGlyph) return

    const { maxScore = 0, only } = this.props
    const result = this.recognizer.Recognize(
      this.strokes[0].map(penPoint => {
        return new $P.Point(penPoint.x, penPoint.y, 0)
      }),
      only,
    )

    if (result.Score > 0 && result.Score < maxScore) {
      const glyph = Glyph.fromTemplateName(result.Name)
      this.props.onGlyph({
        glyph: glyph,
        name: result.Name,
        bounds: this.bounds,
        center: this.center(),
      })
    } else {
      Feedback.Provider.add("Unrecognized glyph", this.center())
    }
  }

  recognize = this._recognize

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
    this.strokes = []
    this.strokeId = 0
    this.lastDrawnPoint = 0
    this.bounds = EMPTY_BOUNDS
    if (this.ctx && this.canvasElement) {
      this.ctx.clearRect(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height,
      )
      this.ctx.beginPath()
    }
  }

  prepareCanvas(canvas: HTMLCanvasElement) {
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1
    // Get the size of the canvas in CSS pixels.
    var rect = canvas.getBoundingClientRect()
    // Give the canvas pixel dimensions of their CSS
    // size * the device pixel ratio.
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    var ctx = canvas.getContext("2d")
    // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.
    if (ctx) {
      ctx.translate(0.5, 0.5)
      ctx.scale(dpr, dpr)
    }
    return ctx
  }

  canvasAdded = (canvas: HTMLCanvasElement | null) => {
    this.canvasElement = canvas
    if (canvas) {
      this.ctx = this.prepareCanvas(canvas)
    }
  }

  draw = Frame.throttle(() => {
    if (
      !this.ctx ||
      !this.strokes[this.strokeId] ||
      this.state.strokeType == undefined
    )
      return

    for (
      this.lastDrawnPoint;
      this.lastDrawnPoint < this.strokes[this.strokeId].length;
      this.lastDrawnPoint++
    ) {
      let point = this.strokes[this.strokeId][this.lastDrawnPoint]
      let settings = StrokeSettings[this.state.strokeType!]
      settings.lineWidth = StrokeWidth(point.pressure, settings.maxLineWith)
      Object.assign(this.ctx, settings)
      if (this.lastDrawnPoint === 0) {
        continue
      }
      const twoPoints = [
        this.strokes[this.strokeId][this.lastDrawnPoint - 1],
        point,
      ]
      const pathString =
        "M " + twoPoints.map(point => `${point.x} ${point.y}`).join(" L ")
      const path = new Path2D(pathString)
      this.ctx.stroke(path)
    }
  })
}

interface OptionProps<T> {
  label: React.ReactNode
  value: T
  selected: boolean
  onChange: (value?: T) => void
}

class Option<T> extends React.Component<OptionProps<T>> {
  render() {
    const { label, value, selected, onChange } = this.props

    return (
      <div
        className={css.Option}
        onPointerDown={() => onChange(value)}
        onPointerUp={() => onChange()}
        onContextMenu={this.onContextMenu}>
        <div
          className={classnames(css.OptionButton, { [css.current]: selected })}
        />
        {label}
      </div>
    )
  }

  onContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
  }
}
