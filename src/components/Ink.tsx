import * as Preact from "preact"
import { StrokeSettings } from "./StrokeRecognizer"

export interface CanvasStroke {
  settings: StrokeSettings
  path: string
}

export interface Props {
  strokes: CanvasStroke[]
}

export default class Ink extends Preact.Component<Props> {
  strokesCanvasEl?: HTMLCanvasElement

  componentDidMount() {
    requestAnimationFrame(this.draw)
  }

  componentDidUpdate() {
    requestAnimationFrame(this.draw)
  }

  draw = () => {
    const { strokes } = this.props

    this.strokesCanvasEl && (this.strokesCanvasEl.width = window.innerWidth)
    this.strokesCanvasEl && (this.strokesCanvasEl.height = window.innerHeight)

    const ctx = this.getDrawingContext()

    if (!ctx || strokes.length == 0) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    strokes.forEach(stroke => this.drawStroke(stroke))
  }

  drawStroke(stroke: CanvasStroke) {
    const ctx = this.getDrawingContext()
    if (!ctx || stroke.path.length == 0) return

    const path = new Path2D(stroke.path)

    Object.assign(ctx, stroke.settings)

    ctx.stroke(path)
  }

  getDrawingContext(): CanvasRenderingContext2D | null | undefined {
    return this.strokesCanvasEl && this.strokesCanvasEl.getContext("2d")
  }

  render() {
    return (
      <canvas
        className="InkLayer"
        ref={(el: HTMLCanvasElement) => {
          this.strokesCanvasEl = el
        }}
      />
    )
  }
}
