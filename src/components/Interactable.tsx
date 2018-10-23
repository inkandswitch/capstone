import classNames from "classnames"
import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import * as Dragger from "../logic/Dragger"
import * as Resizer from "../logic/Resizer"
import * as DOM from "../logic/DOM"
import Warp from "./Warp"
import { createPortal } from "react-dom"

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
      this.setState({ position: nextProps.position })
    }

    if (
      nextProps.originalSize &&
      (!this.props.originalSize ||
        nextProps.originalSize.width !== this.props.originalSize.width ||
        nextProps.originalSize.height !== this.props.originalSize.height)
    ) {
      this.setState({ currentSize: nextProps.originalSize })
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

    const dragState = {
      position: { x: left, y: top },
      offset: { x: left - x, y: top - y },
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
    console.log("drag", x, y)

    if (dragState) {
      const { offset } = dragState
      this.setState({
        dragState: {
          ...dragState,
          position: { x: x + offset.x, y: y + offset.y },
        },
      })
    }
  }

  onResize = (newSize: Size) => {
    this.props.onResize && this.props.onResize(newSize)
    this.setState({ currentSize: newSize })
  }

  onDragStop = (x: number, y: number) => {
    const { ref } = this
    const { onDragOut } = this.props
    const { dragState } = this.state

    console.log("dragstop", x, y)
    this.props.onDragStop && this.props.onDragStop(x, y)
    this.setState({ dragState: undefined, position: { x, y } })

    if (ref && this.dragger && dragState) {
      const { x, y } = dragState.position
      const { parent } = this.dragger

      const targets = document
        .elementsFromPoint(x, y)
        .filter(el => !DOM.isAncestor(el, ref) && el !== parent)

      console.log("before event dispatch", parent, targets)

      if (onDragOut) {
        const dataTransfer = onDragOut()

        for (const target of targets) {
          const { top, left } = target.getBoundingClientRect()

          const event = new DragEvent("drop", {
            dataTransfer,
            screenX: x,
            screenY: y,
            clientX: x - left,
            clientY: y - top,
            bubbles: true,
            cancelable: true,
          } as any)

          console.log(event)

          target.dispatchEvent(event)

          if (event.defaultPrevented) {
            console.log("card removed")
            this.props.onRemoved && this.props.onRemoved()
            break
          }
        }
      }
    }
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
    } else if (this.state.dragState || this.state.isResizing) {
      if (e.type === "pointermove") {
        const point = pointerEventToPoint(e)
        if (this.state.dragState) {
          this.dragger.drag(point)
        } else if (this.state.isResizing) {
          this.resizer.resize(point)
        }
      } else if (e.type === "pointerup" || e.type === "pointercancel") {
        if (this.state.dragState) {
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
    const { dragState } = this.state
    const { position } = dragState || this.state
    const transform = `translate(${position.x}px,${position.y}px)`

    const style = {
      top: 0,
      left: 0,
      zIndex: this.props.z,
      transform,
      position: dragState ? ("fixed" as "fixed") : ("absolute" as "absolute"),
      willChange: "transform",
    }

    // Compute merged class names. Mark with class while dragging.
    const { defaultClassName, defaultClassNameDragging } = this.props
    const className = classNames(defaultClassName, {
      [defaultClassNameDragging || ""]: dragState,
    })

    return (
      <Warp to={dragState ? document.body : null}>
        <div ref={this.onRef} className={className} style={style}>
          {this.props.children}
        </div>
      </Warp>
    )
  }
}
