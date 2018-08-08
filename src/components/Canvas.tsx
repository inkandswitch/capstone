import * as React from "react"

import Pen from "./Pen"

export default class Canvas extends React.Component {
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  last: { x: number; y: number } = { x: 0, y: 0 }

  componentDidMount() {
    if (!this.canvas || !this.ctx) return
    this.canvas.width = window.innerWidth * window.devicePixelRatio
    this.canvas.height = window.innerHeight * window.devicePixelRatio
  }

  shouldComponentUpdate() {
    return false
  }

  render() {
    return (
      <Pen onDown={this.down} onMove={this.move} onUp={this.up}>
        <canvas
          style={style.canvas}
          ref={el => {
            this.canvas = el
            this.ctx = el && el.getContext("2d")
          }}
        />
      </Pen>
    )
  }

  down = (event: React.PointerEvent) => {
    if (!this.ctx) return
    this.last = {
      x: x(event),
      y: y(event),
    }

    // this.ctx.fillStyle = "green"
    // this.ctx.fillRect(x(event), y(event), 5, 5)
    // this.isDrawing = true
    // this.ctx.beginPath()
    // this.ctx.strokeStyle = "black"
    // this.ctx.lineJoin = "round"
    // this.ctx.moveTo(x(event), y(event))
  }

  move = (event: React.PointerEvent) => {
    if (!this.ctx) return
    // if (!this.isDrawing) return
    const pressure = event.pressure
    const xPos = x(event)
    const yPos = y(event)
    requestAnimationFrame(() => {
      this.ctx.beginPath()
      this.ctx.moveTo(this.last.x, this.last.y)
      this.ctx.lineCap = "round"
      this.ctx.lineJoin = "round"
      this.ctx.lineWidth = 5 * pressure + 1
      this.ctx.lineTo(xPos, yPos)
      this.ctx.stroke()
      this.last = { x: xPos, y: yPos }
    })
    // this.ctx.fillStyle = "gold"
    // this.ctx.fillRect(x(event), y(event), 5, 5)

    // console.log("pointerMove")
  }

  up = (event: React.PointerEvent) => {
    // this.ctx.fillStyle = "red"
    // this.ctx.fillRect(x(event), y(event), 5, 5)
    // this.isDrawing = false
    // console.log("pointerUp")
  }
}

const style: { [name: string]: React.CSSProperties } = {
  canvas: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    touchAction: "none",
  },
}

const x = (event: React.PointerEvent) => event.clientX

const y = (event: React.PointerEvent) => event.clientY
