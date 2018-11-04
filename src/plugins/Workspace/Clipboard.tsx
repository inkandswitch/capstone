import { Handler } from "capstone"

interface Props {
  onCut?: (event: ClipboardEvent) => void
  onCopy?: (event: ClipboardEvent) => void
  onPaste?: (event: ClipboardEvent) => void
}

export default class Clipboard extends Handler<Props> {
  filter(event: ClipboardEvent) {
    return true
  }

  componentDidMount() {
    window.addEventListener("cut", this.handle("onCut"))
    window.addEventListener("copy", this.handle("onCopy"))
    window.addEventListener("paste", this.handle("onPaste"))
  }

  componentWillUnmount() {
    window.removeEventListener("cut", this.handle("onCut"))
    window.removeEventListener("copy", this.handle("onCopy"))
    window.removeEventListener("paste", this.handle("onPaste"))
  }

  render() {
    return null
  }
}
