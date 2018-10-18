import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"
import StoreBackend from "../data/StoreBackend"
import * as Debug from "debug"
const log = Debug("component:control:workspace")

type Props = {
  store: StoreBackend
}

type State = {
  workspaceUrl?: string
  history: string[]
  input: string
  copyText: string
  error: string
}

export default class WorkspaceMgr extends React.Component<Props, State> {
  textarea: any

  state = { input: "", error: "", history: [], copyText: "copy", workspaceUrl: undefined }

  componentDidMount() {
    chrome.storage.local.get("history", result => {
      log("history from storage", result)
      this.setState({history: result.history || []})
    })
    this.props.store.workspaceQ.subscribe(workspaceUrl => {
      log("workspace from frontend", workspaceUrl, this.state)
      let history = this.state.history.filter(v => v != workspaceUrl)
      if (this.state.workspaceUrl) {
        history.unshift(this.state.workspaceUrl!)
      }

      this.setState({ history, workspaceUrl })
      chrome.storage.local.set({ history: this.state.history})
    })
  }

  onNewWorkspace = (event: any) => {
    event.preventDefault()
    this.props.store.sendToFrontend({type: "Control", workspaceUrl: null })
  }

  saveUrl(workspaceUrl: string) {
    try {
      Link.parse(workspaceUrl)
      this.setState({
        input: "",
        error: "",
      })
      this.props.store.sendToFrontend({type: "Control" , workspaceUrl  })
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
      const history = [...this.state.history]
      history.splice(index,1)
      this.setState({history})
      chrome.storage.local.set({ history: this.state.history})
    }
  }
  setUrlFn = (url: string) => {
    return (event: any) => {
      this.saveUrl(url)
    }
  }
  render() {
    log("state", this.state)
    return (
      <div>
        <div> Current Workspace: </div>
        <div>
          <textarea
            rows={1}
            cols={85}
            readOnly
            ref={textarea => (this.textarea = textarea)}
            value={this.state.workspaceUrl}
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
        <div>{this.state.error}</div>
        <div>or</div>
        <button onClick={this.onNewWorkspace}>
          {" "}
          Generate A New Workspace{" "}
        </button>
        <div> Previous Workspace </div>
        <ul>
          {" "}
          {this.state.history.map((url,index) => (
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
