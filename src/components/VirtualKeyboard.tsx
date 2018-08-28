import * as Preact from "preact"

interface Props {
  onOpen?: () => void
  onClose?: () => void
  children: JSX.Element
}

interface Model {
  isVirtualKeyboardOpen: boolean
}

export function ensureVirtualKeyboardOpensOnNextFocus() {
  let transferInput = document.getElementById("__VirtualKeyboard_input__")
  if (!transferInput) {
    transferInput = document.createElement("input")
    transferInput.setAttribute("type", "text")
    transferInput.id = "__VirtualKeyboard_input__"
    document.body.appendChild(transferInput)
  }
  transferInput.focus()
  transferInput.click()
}

/* Simple Virtual (On-screen) Keyboard listener.
*
* NOTE: Does not work for the floating keyboard. There is no way to detect floating keyboard open or close.
*
* Chrome doesn't expose an API to directly detect or control the virtual keyboard.
* As a workaround, we can listen for visual viewport resizes and assume the keyboard
* is opening or closing.
*
* Assumes a fullscreen app with orientation change disabled, otherwise other actions
* which trigger the resize event can confuse the component.
*
* There is discussion around adding a virtual keyboard API here: https://bugs.chromium.org/p/chromium/issues/detail?id=856269
*/
export default class VirtualKeyboard extends Preact.Component<Props, Model> {
  constructor(props: Props) {
    super(props)
    this.state = { isVirtualKeyboardOpen: false }
  }

  componentDidMount() {
    window.visualViewport.addEventListener(
      "resize",
      this.onVisualViewportResize,
    )
  }

  componentWillUnmount() {
    window.visualViewport.removeEventListener(
      "resize",
      this.onVisualViewportResize,
    )
  }

  onVisualViewportResize = () => {
    this.setState(
      (prevState: Model) => ({
        isVirtualKeyboardOpen: !prevState.isVirtualKeyboardOpen,
      }),
      () => {
        this.state.isVirtualKeyboardOpen
          ? this.onVirtualKeyboardOpen()
          : this.onVirtualKeyboardClose()
      },
    )
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
