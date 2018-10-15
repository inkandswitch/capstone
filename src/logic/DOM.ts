export const getDragPoint = (e: Point, node: HTMLElement) => {
  const offsetParent = node.offsetParent || node.ownerDocument.body
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
