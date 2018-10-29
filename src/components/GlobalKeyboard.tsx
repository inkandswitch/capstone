import Handler from "./Handler"

interface Props {
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  onKeyPress?: (event: KeyboardEvent) => void
}

export default class GlobalKeyboard extends Handler<Props> {
  componentDidMount() {
    window.addEventListener("keydown", this.handle("onKeyDown"))
    window.addEventListener("keyup", this.handle("onKeyUp"))
    window.addEventListener("keypress", this.handle("onKeyPress"))
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handle("onKeyDown"))
    window.removeEventListener("keyup", this.handle("onKeyUp"))
    window.removeEventListener("keypress", this.handle("onKeyPress"))
  }

  filter(event: KeyboardEvent) {
    return true
  }

  render() {
    return null
  }
}
