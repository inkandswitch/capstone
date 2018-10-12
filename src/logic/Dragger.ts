export interface DragInput {
  x: number
  y: number
}

export interface DraggerOptions {
  onStart?: OnStartHandler
  onDrag?: OnDragHandler
  onStop?: OnStopHandler
  node: HTMLElement
  position: Point
}

export type OnStartHandler = (x: number, y: number) => void
export type OnDragHandler = (x: number, y: number) => void
export type OnStopHandler = (x: number, y: number) => void

export const pointerEventToDragInput = (e: PointerEvent) => ({
  x: e.clientX,
  y: e.clientY,
})

export class Dragger {
  private position: Point
  private previousDragPoint?: Point
  private onStart?: OnStartHandler
  private onDrag?: OnDragHandler
  private onStop?: OnStopHandler
  private node: HTMLElement

  constructor(options: DraggerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.position = options.position
  }

  start(e: DragInput) {
    this.previousDragPoint = this.getDragPoint(e)
    this.onStart && this.onStart(this.position.x, this.position.y)
  }

  drag(e: DragInput) {
    if (!this.previousDragPoint)
      throw new Error("Must call start() before drag()")

    const dragPoint = this.getDragPoint(e)
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

  getDragPoint(e: DragInput) {
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
