import * as React from "react"
import * as Link from "../data/Link"
import Store from "../data/Store"
import * as Debug from "debug"
import * as css from "./css/ControlPanel.css"
const log = Debug("component:control:workspace")

type Props = {
  store: Store
}

type State = {
  url: string | null
  json: string
  history: string[]
  input: string
  copyText: string
  error: string
}

export default class WorkspaceMgr extends React.Component<Props, State> {
  textarea: HTMLTextAreaElement | null = null
  state: State = {
    json: "",
    input: "",
    error: "",
    history: [],
    copyText: "copy",
    url: null,
  }

  componentDidMount() {
    chrome.storage.local.get("history", result => {
      log("history from storage", result)
      this.setState({ history: result.history || [] })
    })

    this.props.store.control().subscribe(msg => {
      console.log("msg", msg)
      if (msg.type == "Control") {
        const url = msg.url
        if (url === this.state.url) return

        const history = this.state.history.filter(v => v != url)

        if (this.state.url) {
          history.unshift(this.state.url)
        }

        this.setState({ history, url })

        chrome.storage.local.set({ history })
      }
    })
  }

  onNewWorkspace = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    this.props.store.setWorkspace(null)
  }

  saveUrl(url: string) {
    try {
      Link.parse(url)
      this.setState({
        input: "",
        error: "",
      })
      this.props.store.setWorkspace(url)
    } catch (e) {
      this.setState({ error: e.message })
    }
  }

  onCopy = (event: any) => {
    this.textarea!.select()
    document.execCommand("copy")
    event.target.focus()
    this.setState({ copyText: "Copied!" })
    setTimeout(() => {
      this.setState({ copyText: "copy" })
    }, 5000)
  }

  onUrlChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault()

    const url: string = event.target.value
    if (url.includes("\n")) {
      this.saveUrl(this.state.input)
    } else {
      this.setState({
        input: event.target.value,
      })
    }
  }

  delUrlFn = (index: number) => {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      const history = [...this.state.history]
      history.splice(index, 1)
      this.setState({ history })
      chrome.storage.local.set({ history })
    }
  }

  setUrlFn = (url: string) => {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
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
            className={css.TextField}
            readOnly
            ref={textarea => (this.textarea = textarea)}
            value={this.state.url || ""}
          />
          <div className={css.RightAligned}>
            <button onClick={this.onCopy}>{this.state.copyText}</button>
          </div>
        </div>
        <div style={{ marginTop: "30px" }}>
          Enter a new workspace url and press Enter:
        </div>
        <textarea
          rows={1}
          className={css.TextField}
          onChange={this.onUrlChange}
          value={this.state.input}
        />
        <div>{this.state.error}</div>
        <div className={css.RightAligned}>
          or
          <button onClick={this.onNewWorkspace}>
            Generate A New Workspace
          </button>
        </div>

        <div style={{ marginTop: "40px" }}> Previous Workspace </div>
        <table style={{ width: "100%" }}>
          <tbody>
            {" "}
            {this.state.history.map((url, index) => (
              <tr key={index}>
                <td
                  style={{
                    alignContent: "left",
                  }}>
                  <a href="#" onClick={this.setUrlFn(url)}>
                    {url}
                  </a>
                </td>
                <td>
                  <a href="#" onClick={this.delUrlFn(index)}>
                    delete
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <code>{this.state.json}</code>
      </div>
    )
  }
}
