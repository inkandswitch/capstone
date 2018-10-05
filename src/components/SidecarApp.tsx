import * as Preact from "preact"

import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./SidecarUploader"
import "./SidecarWorkspace"
import "./Text"
import "./Workspace"

type State = {
  workspaceUrl?: string
  mode: "loading" | "setup" | "ready"
  error?: string
}

export default class SidecarApp extends Preact.Component<{}, State> {
  constructor(props: {}, ctx: any) {
    super(props, ctx)
    this.state = { mode: "loading" }

    chrome.storage.local.get(["workspaceUrl"], ({ workspaceUrl }) => {
      if (workspaceUrl == null) {
        this.setState({ mode: "setup" })
      } else {
        this.setState({ mode: "ready", workspaceUrl })
      }
    })
  }

  render() {
    return (
      <Root store={Content.store}>
        <div style={style.App}>{this.renderContent()}</div>
      </Root>
    )
  }

  renderContent() {
    const { mode, workspaceUrl, error } = this.state

    switch (mode) {
      case "loading":
        return <div>Loading...</div>

      case "setup":
        return (
          <form onSubmit={this.saveUrl}>
            <div>Enter your workspace url and press Enter:</div>
            <input onChange={this.onUrlChange} />
            <div>{error}</div>
          </form>
        )

      case "ready":
        if (!workspaceUrl) return null
        return (
          <Content
            mode="fullscreen"
            type="SidecarWorkspace"
            url={workspaceUrl}
          />
        )
    }
  }

  onUrlChange = (event: any) => {
    this.setState({
      workspaceUrl: event.target.value,
    })
  }

  saveUrl = (event: any) => {
    event.preventDefault()

    const { workspaceUrl } = this.state
    if (!workspaceUrl) return

    try {
      Link.parse(workspaceUrl)
      chrome.storage.local.set({ workspaceUrl }, () => {
        this.setState({ workspaceUrl, mode: "ready" })
      })
    } catch (e) {
      this.setState({ error: e.message })
    }
  }
}

const style = {
  App: {
    fontFamily: "system-ui",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "auto",
  },
}
