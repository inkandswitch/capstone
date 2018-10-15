import { min } from "rxjs/operators"
import * as Draggable from "../components/Draggable"

export interface ResizerOptions {
  onStart?: OnStartHandler
  onDrag?: OnMoveHandler
  onStop?: OnStopHandler
  node: HTMLElement
  size: Size
}

export type OnStartHandler = (width: number, height: number) => void
export type OnMoveHandler = (scaleFactor: number) => void
export type OnStopHandler = (scaleFactor: number) => void

export class Resizer {
  private size: Size
  private scaleFactor: number
  private dragStartPoint?: Point
  private previousDragPoint?: Point
  private onStart?: OnStartHandler
  private onDrag?: OnMoveHandler
  private onStop?: OnStopHandler
  private node: HTMLElement

  constructor(options: ResizerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.size = options.size
    this.scaleFactor = 1.0
  }

  start(e: Point) {
    const dragPoint = Draggable.getDragPoint(e, this.node)
    this.dragStartPoint = dragPoint
    this.previousDragPoint = dragPoint
    this.onStart && this.onStart(this.size.width, this.size.height)
  }

  resize(e: Point) {
    if (!this.dragStartPoint) throw new Error("Must call start() before drag()")

    const dragPoint = Draggable.getDragPoint(e, this.node)
    const delta = {
      x: dragPoint.x - this.dragStartPoint.x,
      y: dragPoint.y - this.dragStartPoint.y,
    }
    const newSize = {
      width: this.size.width + delta.x,
      height: this.size.height + delta.y,
    }
    this.scaleFactor = Math.max(
      newSize.width / this.size.width,
      newSize.height / this.size.height,
    )
    this.previousDragPoint = dragPoint
    this.onDrag && this.onDrag(this.scaleFactor)
  }

  stop() {
    this.previousDragPoint = undefined
    this.onStop && this.onStop(this.scaleFactor)
  }
}
