import * as React from "react"
import Store from "../data/Store"

type Props = {
  store: Store
}

type State = {
  msg: string
  debug: string
}

export default class DebugMgr extends React.Component<Props, State> {
  state = { debug: "", msg: "" }

  componentDidMount() {
    const debug = localStorage.debug || ""
    this.setState({ debug })
  }

  saveDebug(debug: string) {
    chrome.storage.local.set({ debug })
    localStorage.debug = debug
    this.setState({ msg: "change requires app restart" })
    setTimeout(() => {
      this.setState({ msg: "" })
    }, 2000)
  }

  onDebugChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault()

    const url: string = event.target.value
    if (url.endsWith("\n")) {
      this.saveDebug(this.state.debug)
    } else {
      this.setState({
        debug: event.target.value,
        msg: "press enter to save",
      })
    }
  }

  render() {
    const { msg } = this.state
    return (
      <div>
        <div>Enter a new debug filter - * for all:</div>
        <textarea
          rows={1}
          cols={85}
          onChange={this.onDebugChange}
          value={this.state.debug}
        />
        <div>
          <b>{msg}</b>
        </div>
      </div>
    )
  }
}
