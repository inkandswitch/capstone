import * as React from "react"
import { StrokeSettings } from "./StrokeRecognizer"

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

    const points = stroke.path.split("/").filter(v => {
      return v.indexOf("#") >= 0
    })
    if (points.length < 1) return
    let lastPoint = points[0]
    points.forEach((point, index) => {
      if (index == 0) return
      const lastProps = lastPoint.split("#")
      if (lastProps.length != 3) return

      const theseProps = point.split("#")
      if (theseProps.length != 3) return

      const pathString = `M ${lastProps[0]} ${lastProps[1]} L ${
        theseProps[0]
      } ${theseProps[1]}`
      const path = new Path2D(pathString)
      let s = stroke.settings
      s.lineWidth = stroke.settings.maxLineWith * parseFloat(theseProps[2])
      Object.assign(ctx, s)
      ctx.stroke(path)
      lastPoint = point
    })

    // const path = new Path2D(stroke.path)
    // console.log(`line width: ${stroke.settings.lineWidth}`)
    // Object.assign(ctx, stroke.settings)

    // ctx.stroke(path)
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
