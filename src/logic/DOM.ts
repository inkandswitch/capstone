export function getOffsetParent(node: HTMLElement): Element {
  return node.offsetParent || node.ownerDocument.body
}

export function getOffsetFromParent(
  e: Point,
  node: HTMLElement,
  parent?: Element,
) {
  const offsetParent = parent || getOffsetParent(node)
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

export function ancestors(el: Element | null): Element[] {
  if (!el) return []

  return [el].concat(ancestors(el.parentElement))
}

export function isAncestor(el: Element | null, parent: Element): boolean {
  if (!el) return false
  return el === parent || isAncestor(el.parentElement, parent)
}
