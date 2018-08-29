import classNames from "classnames"
import * as Preact from "preact"

import {
  matchesSelectorAndParentsTo,
  addEvent,
  removeEvent,
  addUserSelectStyles,
  removeUserSelectStyles,
  createCSSTransform,
} from "./domFns"
import {
  createCoreData,
  getControlPosition,
  canDragX,
  canDragY,
  createDraggableData,
  getBoundPosition,
} from "./positionFns"
import {
  EventHandler,
  ControlPosition,
  DraggableEventHandler,
  DraggableData,
} from "./types"

const eventNames = {
  start: "pointerdown",
  move: "pointermove",
  stop: "pointerup",
}

interface DraggableBounds {
  left: number
  right: number
  top: number
  bottom: number
}

interface DraggableState {
  dragging: boolean
  lastX: number
  lastY: number
  pointerId?: number
  x: number
  y: number
  slackX: number
  slackY: number
}

// TODO: what is the correct typing for children???
interface DraggableProps {
  allowAnyClick?: boolean
  cancel?: string
  disabled?: boolean
  enableUserSelectHack?: boolean
  offsetParent?: HTMLElement | null
  handle?: string | null
  onStart?: DraggableEventHandler
  onStop?: DraggableEventHandler
  onCancel?: (draggableData: DraggableData) => void
  axis?: "both" | "x" | "y" | "none"
  bounds?: DraggableBounds | string | false
  defaultClassName?: string
  defaultClassNameDragging?: string
  defaultPosition: ControlPosition
  position?: ControlPosition
  z: number
}

export default class Draggable extends Preact.Component<
  DraggableProps,
  DraggableState
> {
  // TODO: not sure why these as are needed.
  static defaultProps = {
    allowAnyClick: false, // by default only accept left click
    cancel: null as null,
    disabled: false,
    enableUserSelectHack: true,
    offsetParent: null as null,
    handle: null as null,
    transform: null as null,
    onStart() {},
    axis: "both",
    bounds: false,
    defaultClassName: "react-draggable",
    defaultClassNameDragging: "react-draggable-dragging",
    defaultPosition: { x: 0, y: 0 },
    position: null as null,
  }

  constructor(props: DraggableProps) {
    super(props)

    this.state = {
      // Whether or not we are currently dragging.
      dragging: false,

      /// Used while dragging to determine deltas.
      lastX: NaN,
      lastY: NaN,

      // Current transform x and y.
      x: props.position ? props.position.x : props.defaultPosition.x,
      y: props.position ? props.position.y : props.defaultPosition.y,

      // Used for compensating for out-of-bounds drags
      slackX: 0,
      slackY: 0,
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
      this.setState({ x: nextProps.position.x, y: nextProps.position.y })
    }
  }

  componentWillUnmount() {
    // Prevents invariant if unmounted while dragging.
    this.setState({ dragging: false })

    // Remove any leftover event handlers. Remove both touch and mouse handlers in case
    // some browser quirk caused a touch event to fire during a mouse move, or vice versa.
    const thisNode = this.base
    if (thisNode) {
      const { ownerDocument } = thisNode
      removeEvent(ownerDocument, eventNames.move, this.handleDrag)
      removeEvent(ownerDocument, eventNames.stop, this.handleDragStop)
      if (this.props.enableUserSelectHack) {
        removeUserSelectStyles(ownerDocument)
      }
    }
  }

  handleDragStart: EventHandler<PointerEvent> = e => {
    // Only accept left-clicks.
    if (
      !this.props.allowAnyClick &&
      typeof e.button === "number" &&
      e.button !== 0
    ) {
      return false
    }

    // Get nodes. Be sure to grab relative document (could be iframed)
    const thisNode = this.base
    if (!thisNode || !thisNode.ownerDocument || !thisNode.ownerDocument.body) {
      throw new Error("<Draggable> not mounted on DragStart!")
    }
    const { ownerDocument } = thisNode

    // Short circuit if handle or cancel prop was provided and selector doesn't match.
    // TODO: not sure what's up with the typings here.
    // TODO: may need to uncomment the ownerDocument.defaultView.Node thing.
    //  (!(e.target instanceof ownerDocument.defaultView.Node)) ||
    if (
      this.props.disabled ||
      (this.props.handle &&
        !matchesSelectorAndParentsTo(
          e.target as Node,
          this.props.handle,
          thisNode,
        )) ||
      (this.props.cancel &&
        matchesSelectorAndParentsTo(
          e.target as Node,
          this.props.cancel,
          thisNode,
        ))
    ) {
      return
    }

    // Set touch identifier in component state if this is a touch event. This allows us to
    // distinguish between individual touches on multitouch screens by identifying which
    // touchpoint was set to this element.
    this.setState({ pointerId: e.pointerId })

    // Get the current drag point from the event. This is used as the offset.
    const { x, y } = getControlPosition(e, this)

    // Create an event object with all the data parents need to make a decision here.
    const coreEvent = createCoreData(this, x, y)

    // Call event handler. If it returns explicit false, cancel.
    const shouldUpdate = this.props.onStart && this.props.onStart(e, coreEvent)
    if (shouldUpdate === false) {
      return
    }

    // Add a style to the body to disable user-select. This prevents text from
    // being selected all over the page.
    if (this.props.enableUserSelectHack) {
      addUserSelectStyles(ownerDocument)
    }

    // Initiate dragging. Set the current x and y as offsets
    // so we know how much we've moved during the drag. This allows us
    // to drag elements around even if they have been moved, without issue.
    this.setState({
      dragging: true,
      lastX: x,
      lastY: y,
    })

    // Add events to the document directly so we catch when the user's mouse/touch moves outside of
    // this element. We use different events depending on whether or not we have detected that this
    // is a touch-capable device.
    addEvent(ownerDocument, eventNames.move, this.handleDrag)
    addEvent(ownerDocument, eventNames.stop, this.handleDragStop)
  }

  handleDrag: EventHandler<PointerEvent> = e => {
    if (!this.state.dragging) {
      return false
    }

    // If we encounter another pointer, cancel the drag and bail. We only
    // support drag for a single pointer at a time.
    if (e.pointerId !== this.state.pointerId) {
      this.handleDragCancel()
      return false
    }

    // Get the current drag point from the event. This is used as the offset.
    const { x, y } = getControlPosition(e, this)
    const coreData = createCoreData(this, x, y)
    const uiData = createDraggableData(this, coreData)

    // TODO: should by DraggableState.
    const newState: any = {
      x: uiData.x,
      y: uiData.y,
    }

    // Keep within bounds.
    if (this.props.bounds) {
      // Save original x and y.
      const { x, y } = newState

      // Add slack to the values used to calculate bound position. This will ensure that if
      // we start removing slack, the element won't react to it right away until it's been
      // completely removed.
      newState.x += this.state.slackX
      newState.y += this.state.slackY

      // Get bound position. This will ceil/floor the x and y within the boundaries.
      const [newStateX, newStateY] = getBoundPosition(
        this,
        newState.x,
        newState.y,
      )
      newState.x = newStateX
      newState.y = newStateY

      // Recalculate slack by noting how much was shaved by the boundPosition handler.
      newState.slackX = this.state.slackX + (x - newState.x)
      newState.slackY = this.state.slackY + (y - newState.y)

      // Update the event we fire to reflect what really happened after bounds took effect.
      // TODO: remove?
      uiData.x = newState.x
      uiData.y = newState.y
      uiData.deltaX = newState.x - this.state.x
      uiData.deltaY = newState.y - this.state.y
    }

    this.setState({ ...newState, lastX: x, lastY: y })
  }

  handleDragStop: EventHandler<PointerEvent> = e => {
    if (!this.state.dragging) {
      return
    }

    if (e.pointerId !== this.state.pointerId) {
      return
    }

    const position = getControlPosition(e, this)
    const { x, y } = position as ControlPosition
    const coreEvent = createCoreData(this, x, y)

    const shouldUpdate =
      this.props.onStop &&
      this.props.onStop(e, createDraggableData(this, coreEvent))
    if (shouldUpdate === false) {
      return
    }

    this.endDrag()
  }

  handleDragCancel = () => {
    const { lastX, lastY } = this.state
    // Fake coreData
    const coreEvent = createCoreData(this, lastX, lastY)
    const draggableData = createDraggableData(this, coreEvent)
    this.props.onCancel && this.props.onCancel(draggableData)
    this.endDrag()
  }

  // Clean up drag state and remove listeners.
  endDrag = () => {
    const thisNode = this.base
    if (thisNode) {
      // Remove user-select hack
      if (this.props.enableUserSelectHack) {
        removeUserSelectStyles(thisNode.ownerDocument)
      }
    }

    // Reset the el.
    this.setState({
      dragging: false,
      lastX: NaN,
      lastY: NaN,
    })

    if (this.base) {
      removeEvent(this.base.ownerDocument, eventNames.move, this.handleDrag)
      removeEvent(this.base.ownerDocument, eventNames.stop, this.handleDragStop)
    }
  }

  onPointerDown: EventHandler<PointerEvent> = e => {
    if (e.pointerType === "pen") return
    return this.handleDragStart(e)
  }

  onPointerUp: EventHandler<PointerEvent> = e => {
    return this.handleDragStop(e)
  }

  onPointerCancel = (e: PointerEvent) => {
    // Handle cancel events to make sure we clean up.
    this.handleDragCancel()
  }

  render() {
    // If this is controlled, we don't want to move it - unless it's dragging.
    const controlled = Boolean(this.props.position)
    const draggable = !controlled || this.state.dragging

    const position = this.props.position || this.props.defaultPosition

    // Compute merged styles.
    const transformOpts = {
      // Set left if horizontal drag is enabled
      x: canDragX(this) && draggable ? this.state.x : position.x,
      // Set top if vertical drag is enabled
      y: canDragY(this) && draggable ? this.state.y : position.y,
    }

    // Compute merged styles.
    // TODO: Should probably refactor this.
    const style = Object.assign(
      { zIndex: this.props.z },
      createCSSTransform(transformOpts),
      { position: "absolute", willChange: "transform" },
    )

    // Compute merged class names. Mark with class while dragging.
    const { defaultClassName, defaultClassNameDragging } = this.props
    const className = classNames(defaultClassName, {
      [defaultClassNameDragging || ""]: this.state.dragging,
    })

    return (
      <div
        className={className}
        style={style}
        onPointerCancel={this.onPointerCancel}
        onPointerDown={this.onPointerDown}>
        {this.props.children}
      </div>
    )
  }
}
