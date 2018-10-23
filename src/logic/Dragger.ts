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
  parent: Element

  constructor(options: DraggerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.parent = DOM.getOffsetParent(this.node)
    this.origin = options.position
  }

  start(e: Point) {
    const dragPosition = DOM.getOffsetFromParent(e, this.node, this.parent)
    this.measurements = DragMetrics.init(dragPosition)
    this.onStart && this.onStart(this.origin.x, this.origin.y)
  }

  drag(e: Point) {
    if (!this.measurements) throw new Error("Must call start() before drag()")

    const dragPoint = DOM.getOffsetFromParent(e, this.node, this.parent)
    this.measurements = DragMetrics.update(this.measurements, dragPoint)
    const translation = this.translate(this.origin, this.measurements)
    this.onDrag && this.onDrag(translation.x, translation.y)
  }

  stop() {
    if (!this.measurements) throw new Error("Must call star() before stop()")
    this.origin = this.translate(this.origin, this.measurements)
    this.measurements = undefined
    this.onStop && this.onStop(this.origin.x, this.origin.y)
  }

  setPosition(e: Point) {
    this.origin = e
    this.measurements = undefined
  }

  private translate(origin: Point, measurements: DragMetrics.Measurements) {
    return {
      x: origin.x + measurements.delta.x,
      y: origin.y + measurements.delta.y,
    }
  }
}
