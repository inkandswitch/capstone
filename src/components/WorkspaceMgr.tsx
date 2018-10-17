import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"

import { ControlProps, ControlState } from "../apps/shared/command"

type State = {
  error: string
  input: string
  copyText: string
}

export default class WorkspaceMgr extends React.Component<ControlProps, State> {
  textarea: any

  state = { input: "", error: "", copyText: "copy" }

  onNewWorkspace = (event: any) => {
    event.preventDefault()
    this.props.tools.newWorkspace(this.props.state)
  }

  saveUrl(input: string) {
    try {
      Link.parse(input)
      this.props.tools.setWorkspace(this.props.state, input)
      this.setState({
        input: "",
        error: "",
      })
    } catch (e) {
      this.setState({ error: e.message })
    }
  }

  onCopy = (event: any) => {
    this.textarea.select()
    document.execCommand("copy")
    event.target.focus()
    this.setState({ copyText: "Copied!" })
    setTimeout(() => {
      this.setState({ copyText: "copy" })
    }, 5000)
  }

  onUrlChange = (event: any) => {
    event.preventDefault()

    const url: string = event.target.value
    if (url.endsWith("\n")) {
      this.saveUrl(this.state.input)
    } else {
      this.setState({
        input: event.target.value,
      })
    }
  }

  delUrlFn = (index: number) => {
    return (event: any) => {
      this.props.state.history.splice(index,1)
      this.props.tools.saveState(this.props.state))
    }
  }
  setUrlFn = (url: string) => {
    return (event: any) => {
      this.saveUrl(url)
    }
  }
  render() {
    let { error } = this.state
    return (
      <div>
        <div> Current Workspace: </div>
        <div>
          <textarea
            rows={1}
            cols={85}
            readOnly
            ref={textarea => (this.textarea = textarea)}
            value={this.props.state.workspaceUrl}
          />
          <a href="#" onClick={this.onCopy}>
            {this.state.copyText}
          </a>
        </div>
        <div>Enter a new workspace url and press Enter:</div>
        <textarea
          rows={1}
          cols={85}
          onChange={this.onUrlChange}
          value={this.state.input}
        />
        <div>{error}</div>
        <div>or</div>
        <button onClick={this.onNewWorkspace}>
          {" "}
          Generate A New Workspace{" "}
        </button>
        <div> Previous Boards </div>
        <ul>
          {" "}
          {this.props.state.history.map((url,index) => (
            <li key={index}>
              <a href="#" onClick={this.setUrlFn(url)}>
                {url}
              </a>
              :
              <a href="#" onClick={this.delUrlFn(index)}>
                del
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}
