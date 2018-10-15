import { min } from "rxjs/operators"
import * as DOM from "./DOM"

export interface ResizerOptions {
  onStart?: OnStartHandler
  onDrag?: OnMoveHandler
  onStop?: OnStopHandler
  node: HTMLElement
  size: Size
}

export type OnStartHandler = () => void
export type OnMoveHandler = (scaleFactor: number) => void
export type OnStopHandler = (scaleFactor: number) => void

export class Resizer {
  private size: Size
  private scaleFactor: number
  private dragStartPoint?: Point
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
    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.dragStartPoint = dragPoint
    this.onStart && this.onStart()
  }

  resize(e: Point) {
    if (!this.dragStartPoint) throw new Error("Must call start() before drag()")

    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    const delta = {
      x: dragPoint.x - this.dragStartPoint.x,
      y: dragPoint.y - this.dragStartPoint.y,
    }
    const newNonAspectSize = {
      width: this.size.width + delta.x,
      height: this.size.height + delta.y,
    }
    this.scaleFactor = Math.max(
      newNonAspectSize.width / this.size.width,
      newNonAspectSize.height / this.size.height,
    )
    this.onDrag && this.onDrag(this.scaleFactor)
  }

  stop() {
    this.onStop && this.onStop(this.scaleFactor)
  }
}
