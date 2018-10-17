import { min } from "rxjs/operators"
import * as DOM from "./DOM"
import * as DragMetrics from "./DragMetrics"

export interface ResizerOptions {
  onStart?: OnStartHandler
  onDrag?: OnMoveHandler
  onStop?: OnStopHandler
  node: HTMLElement
  originalSize: Size
  preserveAspectRatio: boolean
}

export type OnStartHandler = () => void
export type OnMoveHandler = (newSize: Size) => void
export type OnStopHandler = (newSize: Size) => void

export class Resizer {
  private originalSize: Size
  private currentSize: Size
  private preserveAspectRatio: boolean
  private dragStartPoint?: Point
  private onStart?: OnStartHandler
  private onDrag?: OnMoveHandler
  private onStop?: OnStopHandler
  private metrics?: DragMetrics.Metrics
  private node: HTMLElement

  constructor(options: ResizerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.originalSize = options.originalSize
    this.currentSize = options.originalSize
    this.preserveAspectRatio = options.preserveAspectRatio
  }

  start(e: Point) {
    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.metrics = DragMetrics.init(dragPoint)
    this.onStart && this.onStart()
  }

  resize(e: Point) {
    if (!this.metrics) throw new Error("Must call start() before resize()")

    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.metrics = DragMetrics.update(this.metrics, dragPoint)
    let newSize = {
      width: this.originalSize.width + this.metrics.delta.x,
      height: this.originalSize.height + this.metrics.delta.y,
    }

    if (this.preserveAspectRatio) {
      const scaleFactor = Math.max(
        newSize.width / this.originalSize.width,
        newSize.height / this.originalSize.height,
      )
      newSize = {
        width: this.originalSize.width * scaleFactor,
        height: this.originalSize.height * scaleFactor,
      }
    }

    this.currentSize = newSize
    this.onDrag && this.onDrag(newSize)
  }

  stop() {
    if (!this.metrics) throw new Error("Must call start() before stop()")
    this.metrics = undefined
    this.originalSize = this.currentSize
    this.onStop && this.onStop(this.currentSize)
  }
}
