import * as React from "react"

interface Props {
  onOpen?: () => void
  onClose?: () => void
  children?: JSX.Element
}

/* Simple Virtual (On-screen) Keyboard listener.
*
* NOTE: Does not work for the floating keyboard. There is no way to detect floating keyboard open or close.
*
* Chrome doesn't expose an API to directly detect or control the virtual keyboard.
* As a workaround, we can listen for visual viewport resizes and use viewport height changes
* (keyboard opens upward, decreasing viewport height, and closes downward, increasing
* viewport height) as a heuristic to detect if the keyboard is opening or closing.
*
* Resizes and orientation changes can confuse the component.
*
* There is discussion around adding a virtual keyboard API here: https://bugs.chromium.org/p/chromium/issues/detail?id=856269
*/
export default class VirtualKeyboard extends React.Component<Props> {
  lastSeenViewportSize: { width: number; height: number }

  componentDidMount() {
    const { visualViewport } = window
    this.lastSeenViewportSize = {
      width: visualViewport.width,
      height: visualViewport.height,
    }

    visualViewport.addEventListener("resize", this.onVisualViewportResize)
  }

  componentWillUnmount() {
    window.visualViewport.removeEventListener(
      "resize",
      this.onVisualViewportResize,
    )
  }

  onVisualViewportResize = () => {
    const { visualViewport } = window
    const isOpening = visualViewport.height < this.lastSeenViewportSize.height
    isOpening ? this.onVirtualKeyboardOpen() : this.onVirtualKeyboardClose()
    this.lastSeenViewportSize = {
      height: visualViewport.height,
      width: visualViewport.width,
    }
  }

  onVirtualKeyboardOpen = () => {
    this.props.onOpen && this.props.onOpen()
  }

  onVirtualKeyboardClose = () => {
    this.props.onClose && this.props.onClose()
  }

  render() {
    const { children } = this.props
    return Array.isArray(children) ? children[0] : null
  }
}
