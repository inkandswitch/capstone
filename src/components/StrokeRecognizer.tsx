import * as React from "react"
import * as $P from "../modules/$P"
import * as Rx from "rxjs"
import * as Glyph from "../data/Glyph"
import * as Frame from "../logic/Frame"
import Pen, { PenEvent } from "./Pen"
import classnames from "classnames"
import * as css from "./css/StrokeRecognizer.css"
import * as Feedback from "./CommandFeedback"
import { Portal } from "react-portal"
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

export default class StrokeRecognizer extends React.Component<Props, State> {
  canvasElement?: HTMLCanvasElement | null
  ctx?: CanvasRenderingContext2D | null
  isPenDown: boolean
  static strokeTypeSubect: Rx.Subject<StrokeType> = new Rx.Subject()
  subscription: Rx.Subscription

  static defaultProps = {
    delay: 300,
    maxScore: 6,
  }

  recognizer: $P.Recognizer = $P_RECOGNIZER
  points: $P.Point[] = []
  strokeId = 0
  lastDrawnPoint = 0
  bounds: Bounds = EMPTY_BOUNDS

  state = { strokeType: StrokeType.default }

  render() {
    const { strokeType } = this.state
    const style = this.props.style || {}

    return (
      <div style={style}>
        <Pen onPanMove={this.onPanMove} onPanEnd={this.onPanEnd}>
          {this.props.children}
        </Pen>
        <Portal>
          <div>
            <canvas ref={this.canvasAdded} className={css.StrokeLayer} />
            <div className={css.Options}>
              <Option
                label="Glyph"
                value={StrokeType.glyph}
                selected={strokeType === StrokeType.glyph}
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
    this.subscription = StrokeRecognizer.strokeTypeSubect.subscribe(
      strokeType => {
        this.setState({ strokeType })
      },
    )
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onPanStart = (event: PenEvent) => {
    this.onPanMove(event)
  }

  onPanMove = (event: PenEvent) => {
    const { x, y } = event.center
    if (!this.isPenDown) this.isPenDown = true
    this.points.push(new $P.Point(x, y, 0))
    this.updateBounds(x, y)
    this.draw()
  }

  onPanEnd = (event: PenEvent) => {
    if (this.isPenDown) this.isPenDown = false
    this.strokeId += 1
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
    if (this.state.strokeType === strokeType) return
    this.setState({ strokeType }, () => {
      StrokeRecognizer.strokeTypeSubect.next(strokeType)
    })
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
    ctx && ctx.translate(0.5, 0.5)
    ctx && ctx.scale(dpr, dpr)
    return ctx
  }

  canvasAdded = (canvas: HTMLCanvasElement | null) => {
    this.canvasElement = canvas
    if (canvas) {
      this.ctx = this.prepareCanvas(canvas)
    }
  }

  draw = Frame.throttle(() => {
    if (!this.ctx) return

    for (
      this.lastDrawnPoint;
      this.lastDrawnPoint < this.points.length;
      this.lastDrawnPoint++
    ) {
      let point = this.points[this.lastDrawnPoint]
      if (this.lastDrawnPoint === 0) {
        Object.assign(this.ctx, StrokeSettings[this.state.strokeType])
        this.ctx.moveTo(point.X, point.Y)
      } else {
        this.ctx.lineTo(point.X, point.Y)
      }
    }
    this.ctx.stroke()
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
