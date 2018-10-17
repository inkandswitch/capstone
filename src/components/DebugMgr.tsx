import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"

import { ControlProps, ControlState } from "../apps/shared/command"

type State = {
  msg: string
  debug: string
}

export default class DebugMgr extends React.Component<ControlProps, State> {
  textarea: any

  state = { debug: this.props.state.debug, msg: "" }

  saveDebug(filter: string) {
    try {
      this.props.tools.saveState({ ... this.props.state, debug: filter })
      this.setState({ msg: "change requires app restart", })
      setTimeout(() => {
        this.setState({ msg: "", })
      },2000)
    } catch (e) {
      this.setState({ msg: e.message })
    }
  }

  onDebugChange = (event: any) => {
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
    let { msg } = this.state
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
