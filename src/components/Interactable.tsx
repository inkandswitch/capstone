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
  onDragOut?: () => DataTransfer
  onRemoved?: () => void
  onResize?: Resizer.OnMoveHandler
  onResizeStop?: Resizer.OnStopHandler
  defaultClassName?: string
  defaultClassNameDragging?: string
  position: Point
  originalSize: Size
  preserveAspectRatio: boolean
  minDimensionForLongestSide: number
  z: number
}

interface DragState {
  position: Point
  offset: Point
}

interface InteractableState {
  dragState?: DragState
  isResizing: boolean
  position: Point
  currentSize: Size
  opacity: number
}

const RESIZE_TARGET_SIZE: Size = { width: 40, height: 40 }
const DELETE_EDGE_THRESHOLD = 20

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

  constructor(props: InteractableProps, ctx: any) {
    super(props, ctx)

    this.state = {
      isResizing: false,
      position: props.position,
      currentSize: props.originalSize,
      opacity: 1.0,
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
      this.setState({ position: nextProps.position })
      this.dragger && this.dragger.setPosition(nextProps.position)
    }

    if (
      nextProps.originalSize &&
      (!this.props.originalSize ||
        nextProps.originalSize.width !== this.props.originalSize.width ||
        nextProps.originalSize.height !== this.props.originalSize.height)
    ) {
      this.setState({ currentSize: nextProps.originalSize })
      this.resizer && this.resizer.setSize(nextProps.originalSize)
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

  onDragStart = (x: number, y: number) => {
    if (!this.ref) return

    this.props.onStart && this.props.onStart()

    const { top, left } = this.ref.getBoundingClientRect()

    const offset = { x: left - x, y: top - y }
    const position = { x, y }

    const dragState = {
      position,
      offset,
    }

    this.setState({ dragState, isResizing: false })
  }

  onResizeStart = () => {
    this.props.onStart && this.props.onStart()
    this.setState({ isResizing: true, dragState: undefined })
  }

  onDrag = (x: number, y: number) => {
    this.props.onDrag && this.props.onDrag(x, y)
    const { dragState } = this.state

    if (dragState) {
      const { offset } = dragState
      const position = { x, y }

      this.setState({
        dragState: {
          offset,
          position,
        },
      })
    }
  }

  newSizeAdjustedToMin = (newSize: Size) => {
    const { originalSize, minDimensionForLongestSide } = this.props
    if (originalSize.height <= originalSize.width) {
      // landscape or square
      const resolvedWidth = Math.max(minDimensionForLongestSide, newSize.width)
      return {
        width: resolvedWidth,
        height: resolvedWidth * (newSize.height / newSize.width),
      }
    } else {
      // portrait
      const resolvedHeight = Math.max(
        minDimensionForLongestSide,
        newSize.height,
      )
      return {
        width: resolvedHeight * (newSize.width / newSize.height),
        height: resolvedHeight,
      }
    }
  }

  onResize = (newSize: Size) => {
    const resolvedSize = this.newSizeAdjustedToMin(newSize)
    this.props.onResize && this.props.onResize(resolvedSize)
    this.setState({ currentSize: resolvedSize })
  }

  onDragStop = (x: number, y: number) => {
    const { ref } = this
    const { onDragOut } = this.props
    const { dragState } = this.state

    if (ref && this.dragger && dragState) {
      const { offset } = dragState
      const { x, y } = dragState.position
      const screen = {
        x: x + offset.x,
        y: y + offset.y,
      }

      const parent = ref.closest("[data-container]")

      const targets = document
        .elementsFromPoint(Math.max(0, screen.x), Math.max(0, screen.y))
        .filter(el => !ref.contains(el) && el.hasAttribute("data-container"))

      if (onDragOut && targets[0] !== parent) {
        const dataTransfer = onDragOut()

        for (const target of targets) {
          const { top, left } = target.getBoundingClientRect()

          const event = new DragEvent("drop", {
            dataTransfer,
            screenX: screen.x,
            screenY: screen.y,
            clientX: screen.x - left,
            clientY: screen.y - top,
            bubbles: true,
            cancelable: true,
          } as any)

          target.dispatchEvent(event)

          if (event.defaultPrevented) {
            this.props.onRemoved && this.props.onRemoved()
            return
          }
        }
      }

      this.props.onDragStop && this.props.onDragStop(x, y)
      this.setState({ dragState: undefined, position: { x, y } })
    }
  }

  onResizeStop = (newSize: Size) => {
    const resolvedSize = this.newSizeAdjustedToMin(newSize)
    this.props.onResizeStop && this.props.onResizeStop(resolvedSize)
    this.setState({ isResizing: false, currentSize: resolvedSize })
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
    } else if (this.state.dragState || this.state.isResizing) {
      if (e.type === "pointermove") {
        const point = pointerEventToPoint(e)
        if (this.state.dragState) {
          this.dragger.drag(point)
          this.adjustOpacityState(e)
        } else if (this.state.isResizing) {
          this.resizer.resize(point)
        }
      } else if (e.type === "pointerup" || e.type === "pointercancel") {
        if (this.state.dragState) {
          this.dragger.stop()
          if (this.isInDeleteEdgeRange(e)) {
            this.props.onRemoved && this.props.onRemoved()
          }
        } else if (this.state.isResizing) {
          this.resizer.stop()
        }
      }
    }
  }

  adjustOpacityState = (e: PointerEvent) => {
    const offsetFromLeft = e.x
    const offsetFromRight = window.innerWidth - e.x
    const offsetFromTop = e.y

    const lowestOffset = Math.min(
      offsetFromLeft,
      offsetFromRight,
      offsetFromTop,
    )

    if (lowestOffset < DELETE_EDGE_THRESHOLD) {
      const opacity = Math.max(0.25, lowestOffset / DELETE_EDGE_THRESHOLD)
      this.setState({ opacity: opacity })
    } else if (this.state.opacity != 1.0) {
      this.setState({ opacity: 1.0 })
    }
  }

  isInDeleteEdgeRange = (e: PointerEvent) => {
    return (
      e.x < DELETE_EDGE_THRESHOLD ||
      e.x > window.innerWidth - DELETE_EDGE_THRESHOLD ||
      e.y < DELETE_EDGE_THRESHOLD
    )
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
    const { dragState, opacity } = this.state
    const { position } = dragState || this.state
    const transform = `translate(${position.x}px,${position.y}px)`

    const style = {
      top: 0,
      left: 0,
      zIndex: dragState ? 10000001 : this.props.z,
      opacity: opacity,
      transform,
      position: "absolute" as "absolute",
      willChange: "transform",
    }

    // Compute merged class names. Mark with class while dragging.
    const { defaultClassName, defaultClassNameDragging } = this.props
    const className = classNames(defaultClassName, {
      [defaultClassNameDragging || ""]: dragState,
    })

    return (
      <div ref={this.onRef} className={className} style={style}>
        {this.props.children}
      </div>
    )
  }
}
