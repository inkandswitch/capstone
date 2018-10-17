import * as DOM from "./DOM"
import * as DragMetrics from "./DragMetrics"

export interface DraggerOptions {
  onStart?: OnStartHandler
  onDrag?: OnMoveHandler
  onStop?: OnStopHandler
  node: HTMLElement
  position: Point
}

export type OnStartHandler = (x: number, y: number) => void
export type OnMoveHandler = (x: number, y: number) => void
export type OnStopHandler = (x: number, y: number) => void

export class Dragger {
  private measurements?: DragMetrics.Measurements
  private origin: Point
  private onStart?: OnStartHandler
  private onDrag?: OnMoveHandler
  private onStop?: OnStopHandler
  private node: HTMLElement

  constructor(options: DraggerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.origin = options.position
  }

  start(e: Point) {
    const dragPosition = DOM.getOffsetFromParent(e, this.node)
    this.measurements = DragMetrics.init(dragPosition)
    this.onStart && this.onStart(this.origin.x, this.origin.y)
  }

  drag(e: Point) {
    if (!this.measurements) throw new Error("Must call start() before drag()")

    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.measurements = DragMetrics.update(this.measurements, dragPoint)
    const translate = {
      x: this.origin.x + this.measurements.delta.x,
      y: this.origin.y + this.measurements.delta.y,
    }
    this.onDrag && this.onDrag(translate.x, translate.y)
  }

  setPosition(e: Point) {
    this.origin = e
    this.measurements = undefined
  }

  stop() {
    if (!this.measurements) throw new Error("Must call star() before stop()")
    this.origin = {
      x: this.origin.x + this.measurements.delta.x,
      y: this.origin.y + this.measurements.delta.y,
    }
    this.measurements = undefined
    this.onStop && this.onStop(this.origin.x, this.origin.y)
  }
}
