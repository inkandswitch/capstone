import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"
import StoreBackend from "../data/StoreBackend"

type Props = {
  store: StoreBackend
}

type State = {
  msg: string
  debug: string
}

export default class DebugMgr extends React.Component<Props, State> {

  state = { debug: "", msg: "" }

  componentDidMount() {
    chrome.storage.local.get("debug", result => {
      this.setState({debug: result.debug || ""})
    })
  }

  saveDebug(filter: string) {
    try {
      chrome.storage.local.set({debug: filter})
      this.setState({ msg: "change requires app restart", })
      setTimeout(() => {
        this.setState({ msg: "", })
      },2000)
    } catch (e) {
      this.setState({ msg: e.message })
    }
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
        <div><b>{msg}</b></div>
      </div>
    )
  }
}
