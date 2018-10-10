import * as React from "react"
import { StrokeSettings, StrokeWidth } from "./StrokeRecognizer"

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
    // this.drawStroke(strokes[0])
    strokes.forEach(stroke => this.drawStroke(stroke))
  }

  drawStroke(stroke: CanvasStroke) {
    const ctx = this.getDrawingContext()
    ctx && ctx.scale(2, 2)
    if (!ctx || stroke.path.length == 0) return

    const bla =
      "80#100#0.2/170#200#0.3/200#50#0.6/340#200#0.6/503#496#0.8/505#495#0.6/508#508#0.3/610#405#0.2/690#605#0.2"
    const pointStrings = stroke.path.split("/").filter(v => {
      // const pointStrings = bla.split("/").filter(v => {
      return v.indexOf("#") >= 0
    })
    if (pointStrings.length == 0) return

    const firstPointProps = pointStrings[0].split("#")
    if (firstPointProps.length != 3) return
    let pathString = `M ${firstPointProps[0]} ${firstPointProps[1]}`
    let s = stroke.settings

    if (pointStrings.length == 1) {
      pathString += " Z"

      // just draw a point
      const path = new Path2D(pathString)
      const pressure = parseFloat(firstPointProps[2])
      s.lineWidth = StrokeWidth(pressure, s.maxLineWith)
      Object.assign(ctx, s)
      ctx.stroke(path)
    } else {
      pointStrings.map((value, index, array) => {
        if (index == 0 || index >= pointStrings.length - 2) return
        const pointProps = value.split("#")
        if (pointProps.length != 3) return

        const lastPointProps = pointStrings[index - 1].split("#")
        if (lastPointProps.length != 3) return

        const nextPointProps = pointStrings[index + 1].split("#")
        if (nextPointProps.length != 3) return

        const lastX = parseFloat(lastPointProps[0])
        const lastY = parseFloat(lastPointProps[1])
        const nextX = parseFloat(nextPointProps[0])
        const nextY = parseFloat(nextPointProps[1])
        const midPointX = (lastX + nextX) / 2
        const midPointY = (lastY + nextY) / 2
        const x = parseFloat(pointProps[0])
        const y = parseFloat(pointProps[1])
        const pressure = parseFloat(pointProps[2])

        // draw the red bit for original
        let originalPathString = `
        M ${lastPointProps[0]} ${lastPointProps[1]}
        L ${pointProps[0]} ${pointProps[1]}`
        const path = new Path2D(originalPathString)
        s.strokeStyle = "red"
        s.lineWidth = 1
        Object.assign(ctx, s)
        ctx.stroke(path)

        // draw the angle
        // let angleString = `
        // M ${midPointX} ${midPointY}
        // L ${x} ${y}`
        // const anglePath = new Path2D(angleString)
        // s.strokeStyle = "green"
        // s.lineWidth = 1
        // Object.assign(ctx, s)
        // ctx.stroke(anglePath)

        // draw the offset bit
        const angle = Math.atan2(y - midPointY, x - midPointX)
        // console.log(angle)
        let radius = 12 //(s.maxLineWith / 2) * pressure
        let offsetX = 0
        let offsetY = 0
        // if (angle > 0) {
        //   offsetX = x + Math.cos(-angle) * radius
        //   offsetY = y + Math.sin(-angle) * radius
        // } else {
        offsetX = x + Math.cos(angle) * radius
        offsetY = y + Math.sin(angle) * radius
        // }
        // if (angle === 0) {
        //   offsetX = x
        //   offsetY = y - radius
        // }

        // console.log(`angle: ${angle}`)
        pathString += ` L ${offsetX} ${offsetY}`
      })

      const path = new Path2D(pathString)
      s.strokeStyle = "black"
      s.lineWidth = 1
      Object.assign(ctx, s)
      ctx.stroke(path)
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
