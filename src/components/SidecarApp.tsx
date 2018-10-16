import * as React from "react"

import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./SidecarUploader"
import "./SidecarWorkspace"
import "./SidecarREPL"
import "./Text"
import "./Table"
import "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

type Tab = "workspace" | "repl"

type State = {
  workspaceUrl?: string
  mode: "loading" | "setup" | "ready"
  tab: Tab
  error?: string
}

export default class SidecarApp extends React.Component<{}, State> {
  constructor(props: {}, ctx: any) {
    super(props, ctx)
    this.state = { mode: "loading", tab: "repl" }

    const { workspaceUrl } = localStorage
    if (workspaceUrl == null) {
      this.state = { mode: "setup", tab: "repl" }
    } else {
      this.state = { mode: "ready", workspaceUrl, tab: "repl" }
    }
  }

  render() {
    return (
      <Root store={Content.store}>
        <div style={style.App}>
          <GlobalKeyboard onKeyDown={this.onKeyDown} />
          {this.renderContent()}
        </div>
      </Root>
    )
  }

  renderContent() {
    const { mode, workspaceUrl, error, tab } = this.state

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
          <div>
            <button onClick={this.onResetWorkspaceUrl}>
              Reset Workspace URL
            </button>
            <button onClick={() => this.onSwitchTab("workspace")}>
              Workspace
            </button>
            <button onClick={() => this.onSwitchTab("repl")}>REPL</button>

            {tab === "workspace" && (
              <Content
                mode="fullscreen"
                url={Link.setType(workspaceUrl, "SidecarWorkspace")}
              />
            )}

            {tab === "repl" && (
              <Content
                mode="fullscreen"
                url={Link.setType(workspaceUrl, "SidecarREPL")}
              />
            )}
          </div>
        )
    }
  }

  onResetWorkspaceUrl = () => {
    this.setState({
      mode: "setup",
      workspaceUrl: undefined,
    })
  }

  onUrlChange = (event: any) => {
    this.setState({
      workspaceUrl: event.target.value,
    })
  }

  onSwitchTab = (tab: Tab) => {
    this.setState({ tab })
  }

  saveUrl = (event: any) => {
    event.preventDefault()

    const { workspaceUrl } = this.state
    if (!workspaceUrl) return

    try {
      Link.parse(workspaceUrl)
      localStorage.workspaceUrl = workspaceUrl
      this.setState({
        workspaceUrl,
        mode: "ready",
      })
    } catch (e) {
      this.setState({ error: e.message })
    }
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "ShiftRight") {
      Content.store.sendToBackend({
        type: "ToggleDebug",
      })
    }
  }
}

const style = {
  App: {
    fontFamily: "system-ui",
    position: "fixed" as "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "auto",
  },
}
