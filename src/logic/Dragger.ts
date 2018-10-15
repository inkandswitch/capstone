import * as Draggable from "../components/Draggable"

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
  private position: Point
  private previousDragPoint?: Point
  private onStart?: OnStartHandler
  private onDrag?: OnMoveHandler
  private onStop?: OnStopHandler
  private node: HTMLElement

  constructor(options: DraggerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.position = options.position
  }

  start(e: Point) {
    this.previousDragPoint = Draggable.getDragPoint(e, this.node)
    this.onStart && this.onStart(this.position.x, this.position.y)
  }

  drag(e: Point) {
    if (!this.previousDragPoint)
      throw new Error("Must call start() before drag()")

    const dragPoint = Draggable.getDragPoint(e, this.node)
    const delta = {
      x: dragPoint.x - this.previousDragPoint.x,
      y: dragPoint.y - this.previousDragPoint.y,
    }
    this.position = {
      x: this.position.x + delta.x,
      y: this.position.y + delta.y,
    }
    this.previousDragPoint = dragPoint
    this.onDrag && this.onDrag(this.position.x, this.position.y)
  }

  stop() {
    this.previousDragPoint = undefined
    this.onStop && this.onStop(this.position.x, this.position.y)
  }
}
