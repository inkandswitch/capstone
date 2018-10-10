import * as React from "react"
import { StrokeSettings, StrokeWidth, penPointFrom } from "./StrokeRecognizer"

export interface CanvasStroke {
  settings: StrokeSettings
  path: string
}

export interface Props {
  strokes: CanvasStroke[]
}

export default class Ink extends React.Component<Props> {
  strokesCanvasEl?: HTMLCanvasElement

  componentDidMount() {
    requestAnimationFrame(this.draw)
  }

  componentDidUpdate() {
    requestAnimationFrame(this.draw)
  }

  draw = () => {
    const { strokes } = this.props
    this.strokesCanvasEl && this.prepareCanvas(this.strokesCanvasEl)

    const ctx = this.getDrawingContext()

    if (!ctx || strokes.length == 0) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    strokes.forEach(stroke => this.drawStroke(stroke))
  }

  drawStroke(stroke: CanvasStroke) {
    const ctx = this.getDrawingContext()
    if (!ctx || stroke.path.length == 0) return
    let strokeSettings = stroke.settings

    const pointStrings = stroke.path.split("|").filter(v => {
      return v.indexOf("/") >= 0
    })

    if (pointStrings.length === 0) return
    let from = penPointFrom(pointStrings[0])
    if (!from) return

    let pathString = ""
    if (pointStrings.length === 1) {
      pathString = `M ${from.x} ${from.y} C`
      const path = new Path2D(pathString)
      strokeSettings.lineWidth = StrokeWidth(
        from.pressure,
        strokeSettings.maxLineWith,
      )
      Object.assign(ctx, stroke)
      ctx.stroke(path)
    } else {
      pointStrings.forEach((pointString, index) => {
        let to = penPointFrom(pointString)
        if (!to || !from) return
        pathString = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
        const path = new Path2D(pathString)
        strokeSettings.lineWidth = StrokeWidth(
          to.pressure,
          strokeSettings.maxLineWith,
        )
        Object.assign(ctx, strokeSettings)
        ctx.stroke(path)
        from = to
      })
    }
  }

  prepareCanvas(canvas: HTMLCanvasElement) {
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1
    // Get the size of the canvas in CSS pixels.
    var rect = canvas.getBoundingClientRect()
    // Give the canvas pixel dimensions of their CSS
    // size * the device pixel ratio.
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    var ctx = canvas.getContext("2d")
    // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.
    ctx && ctx.scale(dpr, dpr)
    return ctx
  }

  getDrawingContext(): CanvasRenderingContext2D | null | undefined {
    return this.strokesCanvasEl && this.strokesCanvasEl.getContext("2d")
  }

  render() {
    return (
      <canvas
        className="InkLayer"
        ref={(el: HTMLCanvasElement) => {
          if (el) {
            this.prepareCanvas(el)
          }
          this.strokesCanvasEl = el
        }}
      />
    )
  }
}
