import classNames from "classnames"
import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import * as Dragger from "../logic/Dragger"
import * as Resizer from "../logic/Resizer"

interface InteractableProps {
  onStart?: () => void
  onDrag?: Dragger.OnMoveHandler
  onDragStop?: Dragger.OnStopHandler
  onResize?: Resizer.OnMoveHandler
  onResizeStop?: Resizer.OnStopHandler
  defaultClassName?: string
  defaultClassNameDragging?: string
  position: Point
  originalSize: Size
  preserveAspectRatio: boolean
  z: number
}

interface InteractableState {
  isDragging: boolean
  isResizing: boolean
  position: Point
  currentSize: Size
}

const RESIZE_TARGET_SIZE: Size = { width: 40, height: 40 }

export const pointerEventToPoint = (e: PointerEvent): Point => ({
  x: e.clientX,
  y: e.clientY,
})

export default class Interactable extends React.Component<
  InteractableProps,
  InteractableState
> {
  private dragger?: Dragger.Dragger
  private resizer?: Resizer.Resizer
  private ref?: HTMLDivElement
  private subscription?: Rx.Subscription
  private pointerId?: number

  constructor(props: InteractableProps) {
    super(props)

    this.state = {
      isDragging: false,
      isResizing: false,
      position: props.position,
      currentSize: props.originalSize,
    }
  }

  componentWillReceiveProps(nextProps: InteractableProps) {
    // Set x/y if position has changed
    if (
      nextProps.position &&
      (!this.props.position ||
        nextProps.position.x !== this.props.position.x ||
        nextProps.position.y !== this.props.position.y)
    ) {
      this.setState({ position: nextProps.position }, () => {
        if (!this.dragger || !this.ref) return

        // reset dragger once position is updated
        this.dragger = new Dragger.Dragger({
          node: this.ref,
          position: this.props.position,
          onStart: this.onDragStart,
          onDrag: this.onDrag,
          onStop: this.onDragStop,
        })
      })
    }
  }

  componentDidMount() {
    if (!this.ref) return
    this.dragger = new Dragger.Dragger({
      node: this.ref,
      position: this.props.position,
      onStart: this.onDragStart,
      onDrag: this.onDrag,
      onStop: this.onDragStop,
    })
    this.resizer = new Resizer.Resizer({
      node: this.ref,
      originalSize: this.props.originalSize,
      preserveAspectRatio: this.props.preserveAspectRatio,
      onStart: this.onResizeStart,
      onDrag: this.onResize,
      onStop: this.onResizeStop,
    })

    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyPen),
        RxOps.filter(GPS.ifNotInking),
        RxOps.filter(GPS.ifNotEmpty),
        RxOps.map(GPS.toAnyPointer),
        RxOps.map(GPS.toMostRecentEvent),
      )
      .subscribe(this.onPointerEvent)
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onDragStart = () => {
    this.props.onStart && this.props.onStart()
    this.setState({ isDragging: true, isResizing: false })
  }

  onResizeStart = () => {
    this.props.onStart && this.props.onStart()
    this.setState({ isResizing: true, isDragging: false })
  }

  onDrag = (x: number, y: number) => {
    this.props.onDrag && this.props.onDrag(x, y)
    this.setState({ position: { x, y } })
  }

  onResize = (newSize: Size) => {
    this.props.onResize && this.props.onResize(newSize)
    this.setState({ currentSize: newSize })
  }

  onDragStop = (x: number, y: number) => {
    this.props.onDragStop && this.props.onDragStop(x, y)
    this.setState({ isDragging: false })
  }

  onResizeStop = (newSize: Size) => {
    this.props.onResizeStop && this.props.onResizeStop(newSize)
    this.setState({ isResizing: false, currentSize: newSize })
  }

  onPointerEvent = (e: PointerEvent) => {
    if (!this.ref || !this.dragger || !this.resizer) return
    if (e.type === "pointerdown" && this.ref.contains(e.target as Node)) {
      const point = pointerEventToPoint(e)
      const rect = this.ref.getBoundingClientRect()
      if (this.shouldTriggerResize(point, rect)) {
        this.resizer.start(point)
      } else {
        this.dragger.start(point)
      }
    } else if (this.state.isDragging || this.state.isResizing) {
      if (e.type === "pointermove") {
        const point = pointerEventToPoint(e)
        if (this.state.isDragging) {
          this.dragger.drag(point)
        } else if (this.state.isResizing) {
          this.resizer.resize(point)
        }
      } else if (e.type === "pointerup" || e.type === "pointercancel") {
        if (this.state.isDragging) {
          this.dragger.stop()
        } else if (this.state.isResizing) {
          this.resizer.stop()
        }
      }
    }
  }

  shouldTriggerResize = (point: Point, rect: ClientRect | DOMRect) => {
    const localPoint = {
      x: point.x - rect.left,
      y: point.y - rect.top,
    }
    return (
      localPoint.x <= rect.width &&
      localPoint.x >= rect.width - RESIZE_TARGET_SIZE.width &&
      localPoint.y <= rect.height &&
      localPoint.y >= rect.height - RESIZE_TARGET_SIZE.height
    )
  }

  onRef = (ref: HTMLDivElement) => {
    this.ref = ref
  }

  render() {
    const { position } = this.state
    let transform = `translate(${position.x}px,${position.y}px)`

    const style = {
      zIndex: this.props.z,
      transform: transform,
      position: "absolute" as "absolute",
      willChange: "transform",
    }

    // Compute merged class names. Mark with class while dragging.
    const { defaultClassName, defaultClassNameDragging } = this.props
    const className = classNames(defaultClassName, {
      [defaultClassNameDragging || ""]: this.state.isDragging,
    })

    return (
      <div ref={this.onRef} className={className} style={style}>
        {this.props.children}
      </div>
    )
  }
}
