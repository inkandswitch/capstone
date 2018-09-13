import * as Preact from "preact"
import * as $1 from "../modules/$1"
import Pen, { PenEvent } from "./Pen"
import { debounce, delay } from "lodash"

interface Bounds {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface Stroke {
  glyph: Glyph
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

const EMPTY_BOUNDS: Bounds = {
  top: Infinity,
  right: -Infinity,
  bottom: -Infinity,
  left: Infinity,
}

export enum Glyph {
  unknown = 0,
  copy,
  paste,
  delete,
  create,
}

const DEFAULT_RECOGNIZER = new $1.DollarRecognizer()

export default class StrokeRecognizer extends Preact.Component<Props> {
  canvasElement?: HTMLCanvasElement
  isPenDown: boolean

  static defaultProps = {
    delay: 300,
    maxScore: 6,
  }

  recognizer: $1.DollarRecognizer = DEFAULT_RECOGNIZER
  points: $1.Point[] = []
  strokeId = 0
  bounds: Bounds = EMPTY_BOUNDS

  render() {
    return (
      <Pen onPanMove={this.onPanMove} onPanEnd={this.onPanEnd}>
        {this.props.children}
      </Pen>
    )
  }

  onPanMove = ({ center: { x, y } }: PenEvent) => {
    if (!this.canvasElement) {
      this.startDrawing()
    }
    if (!this.isPenDown) this.isPenDown = true
    this.points.push(new $1.Point(x, y))
    this.updateBounds(x, y)
  }

  onPanEnd = (event: PenEvent) => {
    if (this.isPenDown) this.isPenDown = false
    this.strokeId += 1
    this.recognize()
  }

  _recognize = () => {
    if (this.isPenDown) return

    const { maxScore = 0, only } = this.props
    const result = this.recognizer.Recognize(this.points, only)

    if (result.Score > 0 && result.Score < maxScore) {
      this.flashDebugMessage(`I'm a ${result.Name}`)
      const glyph = this.mapResultNameToGlyph(result.Name)
      this.props.onStroke({
        glyph: glyph,
        bounds: this.bounds,
        center: this.center(),
      })
    } else {
      this.flashDebugMessage(`Couldn't recognize anything :(`)
    }
    this.reset()
  }

  recognize = this._recognize //debounce(this._recognize, this.props.delay)

  mapResultNameToGlyph(originalName: string): Glyph {
    switch (originalName) {
      case "x":
      case "delete":
        return Glyph.delete
      case "caret":
        return Glyph.copy
      case "v":
        return Glyph.paste
      case "rectangle":
      case "circle":
        return Glyph.create
    }
    return Glyph.unknown
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
    if (!ctx || this.points.length == 0) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.lineWidth = 4
    for (let i = 0; i < this.points.length; i++) {
      let point = this.points[i]
      if (i === 0) {
        ctx.moveTo(point.X, point.Y)
      } else {
        ctx.lineTo(point.X, point.Y)
      }
    }
    ctx.stroke()
    const center = this.center()
    ctx.fillStyle = "red"
    ctx.fillRect(center.x - 2, center.y - 2, 5, 5)
  }

  getDrawingContext(): CanvasRenderingContext2D | null | undefined {
    return this.canvasElement && this.canvasElement.getContext("2d")
  }

  flashDebugMessage(text: string) {
    const div = document.createElement("div")
    div.className = "DebugMessage"
    const content = document.createTextNode(text)
    div.appendChild(content)
    document.body.appendChild(div)

    const removeText = () => {
      document.body.removeChild(div)
    }
    delay(removeText, 1000)
  }
}
