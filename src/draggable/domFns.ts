import { findInArray, isFunction, int } from "./shims"
import browserPrefix, { browserPrefixToKey } from "./getPrefix"
import { ControlPosition } from "./types"

let matchesSelectorFunc = ""
export function matchesSelector(el: Node, selector: string): boolean {
  // Because TS doesn't think Node is indexable.
  const indexableEl: any = el
  if (!matchesSelectorFunc) {
    matchesSelectorFunc = findInArray(
      [
        "matches",
        "webkitMatchesSelector",
        "mozMatchesSelector",
        "msMatchesSelector",
        "oMatchesSelector",
      ],
      function(method: string) {
        return isFunction(indexableEl[method])
      },
    )
  }

  // Might not be found entirely (not an Element?) - in that case, bail
  if (!isFunction(indexableEl[matchesSelectorFunc])) {
    return false
  }

  return indexableEl[matchesSelectorFunc](selector)
}

// Works up the tree to the draggable itself attempting to match selector.
export function matchesSelectorAndParentsTo(
  el: Node,
  selector: string,
  baseNode: Node,
): boolean {
  let node: Node | null = el
  do {
    if (matchesSelector(node, selector)) return true
    if (node === baseNode) return false
    node = node.parentNode
  } while (node)

  return false
}

export function addEvent(el: Node, event: string, handler: Function): void {
  // Because TS doesn't think Node is indexable.
  const indexableEl: any = el
  if (!indexableEl) {
    return
  }
  if (indexableEl.attachEvent) {
    indexableEl.attachEvent("on" + event, handler)
  } else if (indexableEl.addEventListener) {
    indexableEl.addEventListener(event, handler, true)
  } else {
    indexableEl["on" + event] = handler
  }
}

export function removeEvent(el: Node, event: string, handler: Function): void {
  // Because TS doesn't think Node is indexable.
  const indexableEl: any = el
  if (!indexableEl) {
    return
  }
  if (indexableEl.detachEvent) {
    indexableEl.detachEvent("on" + event, handler)
  } else if (el.removeEventListener) {
    indexableEl.removeEventListener(event, handler, true)
  } else {
    indexableEl["on" + event] = null
  }
}

export function outerHeight(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetTop which is including margin. See getBoundPosition
  let height = node.clientHeight
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node)
  height += int(computedStyle.borderTopWidth)
  height += int(computedStyle.borderBottomWidth)
  return height
}

export function outerWidth(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetLeft which is including margin. See getBoundPosition
  let width = node.clientWidth
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node)
  width += int(computedStyle.borderLeftWidth)
  width += int(computedStyle.borderRightWidth)
  return width
}
export function innerHeight(node: HTMLElement): number {
  let height = node.clientHeight
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node)
  height -= int(computedStyle.paddingTop)
  height -= int(computedStyle.paddingBottom)
  return height
}

export function innerWidth(node: HTMLElement): number {
  let width = node.clientWidth
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node)
  width -= int(computedStyle.paddingLeft)
  width -= int(computedStyle.paddingRight)
  return width
}

// Get from offsetParent
export function offsetXYFromParent(
  evt: { clientX: number; clientY: number },
  offsetParent: HTMLElement,
): ControlPosition {
  const isBody = offsetParent === offsetParent.ownerDocument.body
  const offsetParentRect = isBody
    ? { left: 0, top: 0 }
    : offsetParent.getBoundingClientRect()

  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top

  return { x, y }
}

export function createCSSTransform({ x, y }: { x: number; y: number }): Object {
  // Replace unitless items with px
  return {
    [browserPrefixToKey("transform", browserPrefix)]:
      "translate(" + x + "px," + y + "px)",
  }
}

export function createSVGTransform({ x, y }: { x: number; y: number }): string {
  return "translate(" + x + "," + y + ")"
}

// User-select Hacks:
//
// Useful for preventing blue highlights all over everything when dragging.

// Note we're passing `document` b/c we could be iframed
export function addUserSelectStyles(doc?: Document) {
  if (!doc) return
  let styleEl = doc.getElementById("react-draggable-style-el")
  if (!styleEl) {
    styleEl = doc.createElement("style")
    // Becuase ?.
    ;(<any>styleEl).type = "text/css"
    styleEl.id = "react-draggable-style-el"
    styleEl.innerHTML =
      ".react-draggable-transparent-selection *::-moz-selection {background: transparent;}\n"
    styleEl.innerHTML +=
      ".react-draggable-transparent-selection *::selection {background: transparent;}\n"
    doc.getElementsByTagName("head")[0].appendChild(styleEl)
  }
  if (doc.body) addClassName(doc.body, "react-draggable-transparent-selection")
}

export function removeUserSelectStyles(doc?: Document) {
  try {
    if (doc && doc.body)
      removeClassName(doc.body, "react-draggable-transparent-selection")
    // Because IE.
    if ((<any>doc).selection) {
      // Because IE
      ;(<any>doc).selection.empty()
    } else {
      window.getSelection().removeAllRanges() // remove selection caused by scroll
    }
  } catch (e) {
    // probably IE
  }
}

export function styleHacks(childStyle: Object = {}): Object {
  // Workaround IE pointer events; see #51
  // https://github.com/mzabriskie/react-draggable/issues/51#issuecomment-103488278
  return {
    touchAction: "none",
    ...childStyle,
  }
}

export function addClassName(el: HTMLElement, className: string) {
  if (el.classList) {
    el.classList.add(className)
  } else {
    if (!el.className.match(new RegExp(`(?:^|\\s)${className}(?!\\S)`))) {
      el.className += ` ${className}`
    }
  }
}

export function removeClassName(el: HTMLElement, className: string) {
  if (el.classList) {
    el.classList.remove(className)
  } else {
    el.className = el.className.replace(
      new RegExp(`(?:^|\\s)${className}(?!\\S)`, "g"),
      "",
    )
  }
}
