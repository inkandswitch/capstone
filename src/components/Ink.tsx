import * as React from "react"
import * as Rx from "rxjs"
import * as Frame from "../logic/Frame"
import classnames from "classnames"
import * as css from "./css/Ink.css"
import { Portal } from "react-portal"
import * as GPS from "../logic/GPS"
import * as RxOps from "rxjs/operators"

interface Bounds {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface PenPoint {
  x: number
  y: number
  strokeWidth: number
}

export interface InkStroke {
  points: PenPoint[]
  settings: StrokeSettings
}

export interface Props {
  strokes: InkStroke[]
  onInkStroke?: (strokes: InkStroke[]) => void
  style?: {}
}

const EMPTY_BOUNDS: Bounds = {
  top: Infinity,
  right: -Infinity,
  bottom: -Infinity,
  left: Infinity,
}

enum StrokeType {
  ink = "ink",
  erase = "erase",
  default = ink,
}

export interface StrokeSettings {
  readonly globalCompositeOperation: string
  readonly strokeStyle: string
  readonly lineCap: string
  readonly lineJoin: string
  lineWidth: number
}

const StrokeMappings: { [st: string]: (pressure: number) => number } = {
  [StrokeType.ink]: pressure => {
    return Math.max(1.5, 16 * Math.pow(pressure, 12))
  },
  [StrokeType.erase]: pressure => {
    return Math.max(16, 120 * Math.pow(pressure, 3))
  },
}

const StrokeSettings: { [st: string]: StrokeSettings } = {
  [StrokeType.ink]: {
    globalCompositeOperation: "source-over",
    strokeStyle: "black",
    lineCap: "round",
    lineJoin: "round",
    lineWidth: 1.5,
  },
  [StrokeType.erase]: {
    globalCompositeOperation: "destination-out",
    strokeStyle: "white",
    lineCap: "round",
    lineJoin: "round",
    lineWidth: 8,
  },
}

interface State {
  strokeType?: StrokeType
  eraserPosition?: PenPoint
}

export default class Ink extends React.Component<Props, State> {
  canvasElement?: HTMLCanvasElement | null
  ctx?: CanvasRenderingContext2D | null
  pointerEventSubscription?: Rx.Subscription

  strokes: InkStroke[] = []
  strokeId = 0
  lastDrawnPoint = 0
  shouldRedrawDryInk = true
  bounds: Bounds = EMPTY_BOUNDS

  state: State = {}

  componentDidMount() {
    requestAnimationFrame(this.drawDry)
    this.pointerEventSubscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyPen),
        RxOps.filter(GPS.ifNotEmpty),
        RxOps.map(GPS.toAnyPointer),
      )
      .subscribe(this.onPenEvent)
  }

  componentWillUnmount() {
    this.pointerEventSubscription && this.pointerEventSubscription.unsubscribe()
  }

  componentDidUpdate() {
    requestAnimationFrame(this.drawDry)
  }

  render() {
    const { strokeType, eraserPosition } = this.state
    const style = this.props.style || {}
    return (
      <div style={style}>
        <Portal>
          <div>
            {eraserPosition != undefined ? (
              <div
                className={css.Eraser}
                style={{
                  left: eraserPosition.x,
                  top: eraserPosition.y,
                  width: eraserPosition.strokeWidth,
                  height: eraserPosition.strokeWidth,
                }}
              />
            ) : null}
            <canvas ref={this.canvasAdded} className={css.InkLayer} />
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

  onPenEvent = (event: PointerEvent) => {
    if (!this.state.strokeType) return
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
    const { strokeType } = this.state
    if (!strokeType) return

    const coalesced: PointerEvent[] = event.getCoalescedEvents()
    if (!this.strokes[this.strokeId]) {
      this.strokes[this.strokeId] = {
        points: [],
        settings: StrokeSettings[strokeType],
      }
    }
    this.strokes[this.strokeId].points.push(
      ...coalesced.map((value, i, a) => {
        return {
          x: value.x,
          y: value.y,
          strokeWidth: StrokeMappings[strokeType](value.pressure),
        }
      }),
    )

    if (strokeType == StrokeType.erase) {
      const eraserPosition = {
        x: event.x,
        y: event.y,
        strokeWidth: StrokeMappings[strokeType](event.pressure),
      }
      this.setState({ eraserPosition })
    }

    this.updateBounds(x, y)
    this.drawWet()
  }

  onPanEnd = (event: PointerEvent) => {
    this.strokeId += 1
    this.lastDrawnPoint = 0
    if (this.state.eraserPosition) {
      this.setState({ eraserPosition: undefined })
    }
  }

  inkStroke = () => {
    if (!this.props.onInkStroke || !this.state.strokeType) {
      return
    }
    this.shouldRedrawDryInk = true
    this.props.onInkStroke(this.strokes)
  }

  onStrokeTypeChange = (strokeType?: StrokeType) => {
    if (this.state.strokeType === strokeType) return
    if (!strokeType) {
      GPS.setInteractionMode(GPS.InteractionMode.default)
      this.setState({ eraserPosition: undefined })
      this.shouldRedrawDryInk = true
      this.inkStroke()
    } else {
      GPS.setInteractionMode(GPS.InteractionMode.inking)
    }
    this.setState({ strokeType })
  }

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

  drawWet = Frame.throttle(() => {
    if (!this.ctx || !this.strokes[this.strokeId] || !this.state.strokeType)
      return

    for (
      this.lastDrawnPoint;
      this.lastDrawnPoint < this.strokes[this.strokeId].points.length;
      this.lastDrawnPoint++
    ) {
      let point = this.strokes[this.strokeId].points[this.lastDrawnPoint]
      let settings = StrokeSettings[this.state.strokeType]
      settings.lineWidth = point.strokeWidth
      Object.assign(this.ctx, settings)
      if (this.lastDrawnPoint === 0) {
        continue
      }
      const twoPoints = [
        this.strokes[this.strokeId].points[this.lastDrawnPoint - 1],
        point,
      ]
      const pathString =
        "M " + twoPoints.map(point => `${point.x} ${point.y}`).join(" L ")
      const path = new Path2D(pathString)
      this.ctx.stroke(path)
    }
  })

  drawDry = Frame.throttle(() => {
    if (!this.canvasElement || !this.shouldRedrawDryInk) return
    this.reset()
    const { strokes } = this.props
    this.prepareCanvas(this.canvasElement)
    const ctx = this.canvasElement.getContext("2d")
    if (!ctx || strokes.length == 0) return
    strokes.forEach(stroke => this.drawDryStroke(stroke))
    this.shouldRedrawDryInk = false
  })

  drawDryStroke(stroke: InkStroke) {
    const ctx = this.canvasElement && this.canvasElement.getContext("2d")
    if (!ctx || stroke.points.length == 0) return
    let strokeSettings = stroke.settings

    let from = stroke.points[0]
    if (!from) return

    let pathString = ""
    if (stroke.points.length === 1) {
      pathString = `M ${from.x} ${from.y} C`
      const path = new Path2D(pathString)
      strokeSettings.lineWidth = from.strokeWidth
      Object.assign(ctx, stroke)
      ctx.stroke(path)
    } else {
      stroke.points.forEach((to, index) => {
        if (!to || !from) return
        pathString = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
        const path = new Path2D(pathString)
        strokeSettings.lineWidth = to.strokeWidth
        Object.assign(ctx, strokeSettings)
        ctx.stroke(path)
        from = to
      })
    }
  }
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
