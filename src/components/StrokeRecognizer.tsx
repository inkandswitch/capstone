import * as Preact from "preact"
import * as $P from "../modules/$P"
import * as Glyph from "../data/Glyph"
import Pen, { PenEvent } from "./Pen"
import classnames from "classnames"
import * as css from "./css/StrokeRecognizer.css"
import * as Feedback from "./CommandFeedback"
const templates = require("../modules/$P/glyph-templates.json")

interface Bounds {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface GlyphEvent {
  glyph: Glyph.Glyph
  name: string
  bounds: Bounds
  center: { x: number; y: number }
}

export interface InkStrokeEvent {
  points: $P.Point[]
  settings: StrokeSettings
}

export interface Props {
  onGlyph?: (stroke: GlyphEvent) => void
  onInkStroke?: (stroke: InkStrokeEvent) => void
  delay?: number
  maxScore?: number
  only?: string[]
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
  glyph,
  default = ink,
}

export interface StrokeSettings {
  readonly globalCompositeOperation: string
  readonly strokeStyle: string
  readonly lineWidth: number
  readonly lineCap: string
  readonly lineJoin: string
}

const StrokeSettings: { [st: number]: StrokeSettings } = {
  [StrokeType.ink]: {
    globalCompositeOperation: "source-over",
    strokeStyle: "black",
    lineCap: "round",
    lineJoin: "round",
    lineWidth: 4,
  },
  [StrokeType.erase]: {
    globalCompositeOperation: "destination-out",
    strokeStyle: "LightCoral",
    lineCap: "round",
    lineJoin: "round",
    lineWidth: 12,
  },
  [StrokeType.glyph]: {
    globalCompositeOperation: "source-over",
    strokeStyle: "SkyBlue",
    lineCap: "round",
    lineJoin: "round",
    lineWidth: 4,
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
  strokeType: StrokeType
}

export default class StrokeRecognizer extends Preact.Component<Props, State> {
  canvasElement?: HTMLCanvasElement
  isPenDown: boolean

  static defaultProps = {
    delay: 300,
    maxScore: 6,
  }

  recognizer: $P.Recognizer = $P_RECOGNIZER
  points: $P.Point[] = []
  strokeId = 0
  lastDrawnPoint = 1 // the boundary case is to move to the 0th point and draw to the 1st
  bounds: Bounds = EMPTY_BOUNDS

  state = { strokeType: StrokeType.default }

  render() {
    const { strokeType } = this.state

    return (
      <div style={{ display: "contents" }}>
        <Pen onPanMove={this.onPanMove} onPanEnd={this.onPanEnd}>
          {this.props.children}
        </Pen>
        <div style={{ position: "fixed", bottom: 0, left: 0 }}>
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
    )
  }

  onPanStart = (event: PenEvent) => {
    this.onPanMove(event)
  }

  onPanMove = (event: PenEvent) => {
    const { x, y } = event.center
    if (!this.canvasElement) {
      this.startDrawing()
    }
    if (!this.isPenDown) this.isPenDown = true
    this.points.push(new $P.Point(x, y, 0))
    this.updateBounds(x, y)
  }

  onPanEnd = (event: PenEvent) => {
    if (this.isPenDown) this.isPenDown = false
    this.strokeId += 1
    this.lastDrawnPoint = 1
    switch (this.state.strokeType) {
      case StrokeType.glyph:
        this.recognize()
        break
      case StrokeType.ink:
        this.inkStroke()
        break
      case StrokeType.erase:
        this.inkStroke()
        break
    }
    this.reset()
  }

  inkStroke = () => {
    if (!this.props.onInkStroke) {
      return
    }
    this.props.onInkStroke({
      points: this.points,
      settings: StrokeSettings[this.state.strokeType],
    })
  }

  onStrokeTypeChange = (strokeType: StrokeType = StrokeType.default) => {
    this.setState({ strokeType })
  }

  _recognize = () => {
    if (this.isPenDown) return
    if (!this.props.onGlyph) return

    const { maxScore = 0, only } = this.props
    const result = this.recognizer.Recognize(this.points, only)

    if (result.Score > 0 && result.Score < maxScore) {
      //this.flashDebugMessage(`I'm a ${result.Name}`)
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

  recognize = this._recognize //debounce(this._recognize, this.props.delay)

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
    this.stopDrawing()
  }

  startDrawing() {
    if (!this.canvasElement) {
      this.addCanvas()
    }
    requestAnimationFrame(this.draw)
  }

  draw = () => {
    if (!this.canvasElement) return
    this.drawStrokes()
    requestAnimationFrame(this.draw)
  }

  stopDrawing() {
    this.removeCanvas()
  }

  addCanvas() {
    this.canvasElement = document.createElement("canvas")
    this.canvasElement.width = window.innerWidth
    this.canvasElement.height = window.innerHeight
    this.canvasElement.className = "StrokeLayer"
    document.body.appendChild(this.canvasElement)
  }

  removeCanvas() {
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement)
      this.canvasElement = undefined
    }
  }

  drawStrokes() {
    const ctx = this.getDrawingContext()
    if (!ctx || this.points.length < 2) return

    Object.assign(ctx, StrokeSettings[this.state.strokeType])

    let point = this.points[this.lastDrawnPoint - 1]
    if (this.lastDrawnPoint === 0) ctx.moveTo(point.X, point.Y)

    for (
      this.lastDrawnPoint;
      this.lastDrawnPoint < this.points.length;
      this.lastDrawnPoint++
    ) {
      let point = this.points[this.lastDrawnPoint]
      ctx.lineTo(point.X, point.Y)
    }
    ctx.stroke()
  }

  getDrawingContext(): CanvasRenderingContext2D | null | undefined {
    return this.canvasElement && this.canvasElement.getContext("2d")
  }
}

interface OptionProps<T> {
  label: Preact.ComponentChildren
  value: T
  selected: boolean
  onChange: (value?: T) => void
}

class Option<T> extends Preact.Component<OptionProps<T>> {
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

  onContextMenu = (event: Event) => {
    event.preventDefault()
  }
}
