import classNames from "classnames"
import * as React from "react"
import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as GPS from "../logic/GPS"
import * as Dragger from "../logic/Dragger"

interface DraggableProps {
  onStart?: Dragger.OnStartHandler
  onDrag?: Dragger.OnDragHandler
  onStop?: Dragger.OnStopHandler
  defaultClassName?: string
  defaultClassNameDragging?: string
  position: Point
  z: number
}

interface DraggableState {
  isDragging: boolean
  position: Point
}

export default class Draggable extends React.Component<
  DraggableProps,
  DraggableState
> {
  private dragger?: Dragger.Dragger
  private ref?: HTMLDivElement
  private subscription?: Rx.Subscription
  private pointerId?: number

  constructor(props: DraggableProps) {
    super(props)

    this.state = {
      isDragging: false,
      position: props.position,
    }
  }

  componentWillReceiveProps(nextProps: any) {
    // Set x/y if position has changed
    if (
      nextProps.position &&
      (!this.props.position ||
        nextProps.position.x !== this.props.position.x ||
        nextProps.position.y !== this.props.position.y)
    ) {
      // TODO: handle this case
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

    this.subscription = GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyPen),
        RxOps.filter(GPS.ifNotInking),
        RxOps.filter(GPS.ifNotEmpty),
        RxOps.map(GPS.toAnyPointer),
      )
      .subscribe(this.onPointerEvent)
  }

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe()
  }

  onDragStart = (x: number, y: number) => {
    this.props.onStart && this.props.onStart(x, y)
    this.setState({ isDragging: true })
  }

  onDrag = (x: number, y: number) => {
    this.props.onDrag && this.props.onDrag(x, y)
    this.setState({ position: { x, y } })
  }
  onDragStop = (x: number, y: number) => {
    this.props.onStop && this.props.onStop(x, y)
    this.setState({ isDragging: false })
  }

  onPointerEvent = (e: PointerEvent) => {
    if (!this.ref || !this.dragger) return
    if (e.type === "pointerdown" && this.ref.contains(e.target as Node)) {
      this.dragger.start(Dragger.pointerEventToDragInput(e))
    } else if (this.state.isDragging) {
      if (e.type === "pointermove") {
        this.dragger.drag(Dragger.pointerEventToDragInput(e))
      } else if (e.type === "pointerup" || e.type === "pointercancel") {
        this.dragger.stop()
      }
    }
  }

  onRef = (ref: HTMLDivElement) => {
    this.ref = ref
  }

  render() {
    // If this is controlled, we don't want to move it - unless it's dragging.
    const { position } = this.state
    const style = {
      zIndex: this.props.z,
      transform: `translate(${position.x}px,${position.y}px)`,
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
