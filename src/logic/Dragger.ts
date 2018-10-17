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
  private metrics?: DragMetrics.Metrics
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
    this.metrics = DragMetrics.init(dragPosition)
    this.onStart && this.onStart(this.origin.x, this.origin.y)
  }

  drag(e: Point) {
    if (!this.metrics) throw new Error("Must call start() before drag()")

    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.metrics = DragMetrics.update(this.metrics, dragPoint)
    const translate = {
      x: this.origin.x + this.metrics.delta.x,
      y: this.origin.y + this.metrics.delta.y,
    }
    this.onDrag && this.onDrag(translate.x, translate.y)
  }

  setPosition(e: Point) {
    this.origin = e
    this.metrics = undefined
  }

  stop() {
    if (!this.metrics) throw new Error("Must call star() before stop()")
    this.origin = {
      x: this.origin.x + this.metrics.delta.x,
      y: this.origin.y + this.metrics.delta.y,
    }
    this.metrics = undefined
    this.onStop && this.onStop(this.origin.x, this.origin.y)
  }
}
