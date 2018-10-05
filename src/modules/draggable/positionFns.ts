import { isNum, int } from "./shims"
import {
  innerWidth,
  innerHeight,
  offsetXYFromParent,
  outerWidth,
  outerHeight,
} from "./domFns"

import Draggable from "./index"
import { Bounds, ControlPosition, DraggableData } from "./types"

export function getBoundPosition(
  draggable: Draggable,
  node: HTMLDivElement,
  x: number,
  y: number,
): [number, number] {
  // If no bounds, short-circuit and move on
  if (!draggable.props.bounds) return [x, y]

  // Clone new bounds
  let { bounds } = draggable.props
  bounds = typeof bounds === "string" ? bounds : cloneBounds(bounds)

  if (typeof bounds === "string") {
    const { ownerDocument } = node
    const ownerWindow = ownerDocument.defaultView
    let boundNode
    if (bounds === "parent") {
      boundNode = node.parentNode
    } else {
      boundNode = ownerDocument.querySelector(bounds)
    }
    if (!(boundNode instanceof HTMLElement)) {
      throw new Error(
        'Bounds selector "' + bounds + '" could not find an element.',
      )
    }
    const nodeStyle = ownerWindow.getComputedStyle(node)
    const boundNodeStyle = ownerWindow.getComputedStyle(boundNode)
    // Compute bounds. This is a pain with padding and offsets but this gets it exactly right.
    bounds = {
      left:
        -node.offsetLeft +
        int(boundNodeStyle.paddingLeft) +
        int(nodeStyle.marginLeft),
      top:
        -node.offsetTop +
        int(boundNodeStyle.paddingTop) +
        int(nodeStyle.marginTop),
      right:
        innerWidth(boundNode) -
        outerWidth(node) -
        node.offsetLeft +
        int(boundNodeStyle.paddingRight) -
        int(nodeStyle.marginRight),
      bottom:
        innerHeight(boundNode) -
        outerHeight(node) -
        node.offsetTop +
        int(boundNodeStyle.paddingBottom) -
        int(nodeStyle.marginBottom),
    }
  }

  // Keep x and y below right and bottom limits...
  if (isNum(bounds.right)) x = Math.min(x, bounds.right)
  if (isNum(bounds.bottom)) y = Math.min(y, bounds.bottom)

  // But above left and top limits.
  if (isNum(bounds.left)) x = Math.max(x, bounds.left)
  if (isNum(bounds.top)) y = Math.max(y, bounds.top)

  return [x, y]
}

export function snapToGrid(
  grid: [number, number],
  pendingX: number,
  pendingY: number,
): [number, number] {
  const x = Math.round(pendingX / grid[0]) * grid[0]
  const y = Math.round(pendingY / grid[1]) * grid[1]
  return [x, y]
}

export function canDragX(draggable: Draggable): boolean {
  return draggable.props.axis === "both" || draggable.props.axis === "x"
}

export function canDragY(draggable: Draggable): boolean {
  return draggable.props.axis === "both" || draggable.props.axis === "y"
}

// Get {x, y} positions from event.
export function getControlPosition(
  e: React.PointerEvent,
  draggable: Draggable,
  node: HTMLDivElement,
): ControlPosition {
  // User can provide an offsetParent if desired.
  const offsetParent =
    draggable.props.offsetParent || node.offsetParent || node.ownerDocument.body
  return offsetXYFromParent(e, offsetParent as HTMLElement)
}

// Create an data object exposed by <Draggable>'s events
export function createCoreData(
  draggable: Draggable,
  node: HTMLDivElement,
  x: number,
  y: number,
): DraggableData {
  const state = draggable.state
  const isStart = !isNum(state.lastX)

  if (isStart) {
    // If this is our first move, use the x and y as last coords.
    return {
      node,
      deltaX: 0,
      deltaY: 0,
      lastX: x,
      lastY: y,
      x,
      y,
    }
  } else {
    // Otherwise calculate proper values.
    return {
      node,
      deltaX: x - state.lastX,
      deltaY: y - state.lastY,
      lastX: state.lastX,
      lastY: state.lastY,
      x,
      y,
    }
  }
}

// Create an data exposed by <Draggable>'s events
export function createDraggableData(
  draggable: Draggable,
  coreData: DraggableData,
): DraggableData {
  return {
    node: coreData.node,
    x: draggable.state.x + coreData.deltaX,
    y: draggable.state.y + coreData.deltaY,
    deltaX: coreData.deltaX,
    deltaY: coreData.deltaY,
    lastX: draggable.state.x,
    lastY: draggable.state.y,
  }
}

// A lot faster than stringify/parse
function cloneBounds(bounds: Bounds): Bounds {
  return {
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.bottom,
  }
}
