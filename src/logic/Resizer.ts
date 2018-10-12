import { min } from "rxjs/operators"

export interface ResizeInput {
  x: number
  y: number
}

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

export const pointerEventToResizeInput = (e: PointerEvent): ResizeInput => ({
  x: e.clientX,
  y: e.clientY,
})

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

  start(e: ResizeInput) {
    const dragPoint = this.getDragPoint(e)
    this.dragStartPoint = dragPoint
    this.previousDragPoint = dragPoint
    this.onStart && this.onStart(this.size.width, this.size.height)
  }

  resize(e: ResizeInput) {
    if (!this.dragStartPoint) throw new Error("Must call start() before drag()")

    const dragPoint = this.getDragPoint(e)
    const delta = {
      x: dragPoint.x - this.dragStartPoint.x,
      y: dragPoint.y - this.dragStartPoint.y,
    }
    console.log(`size: ${this.size.width}`)
    console.log(`delta: ${delta.x}`)
    const newSize = {
      width: this.size.width + delta.x,
      height: this.size.height + delta.y,
    }
    console.log(`newSize: ${newSize.width}`)
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

  private getDragPoint(e: ResizeInput) {
    const offsetParent = this.node.offsetParent || this.node.ownerDocument.body
    const offsetParentIsBody = offsetParent === offsetParent.ownerDocument.body
    const offsetBoundingRect = offsetParentIsBody
      ? { top: 0, left: 0 }
      : offsetParent.getBoundingClientRect()

    const offsetPosition = {
      x: e.x + offsetParent.scrollLeft - offsetBoundingRect.left,
      y: e.y + offsetParent.scrollTop - offsetBoundingRect.top,
    }
    return offsetPosition
  }
}
