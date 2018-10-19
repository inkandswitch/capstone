import * as React from "react"

import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./SidecarUploader"
import "./SidecarWorkspace"
import "./Text"
import "./Table"
import "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

type State = {
  workspaceUrl?: string
  mode: "loading" | "setup" | "ready"
  error?: string
}

export default class SidecarApp extends React.Component<{}, State> {
  constructor(props: {}, ctx: any) {
    super(props, ctx)
    console.log("Sidecar start", Content.store.getWorkspace())
    this.loadWorkspaceUrl(Content.store.getWorkspace())

    Content.store.control().subscribe(message => {
      if (!message) return
      this.loadWorkspaceUrl(message.workspaceUrl)
    })
  }

  loadWorkspaceUrl(workspaceUrl: string | null) {
    this.setState({ mode: "loading" })

    console.log("load workspace url", workspaceUrl)
    if (!workspaceUrl) {
      this.setState({ mode: "setup" })
    } else {
      console.log("set workspace/state", workspaceUrl)
      Content.store.setWorkspace(workspaceUrl)
      this.state = {
        mode: "ready",
        workspaceUrl,
      }
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
          <div>
            <Content
              mode="fullscreen"
              url={Link.setType(workspaceUrl, "SidecarWorkspace")}
            />
            <button onClick={this.onResetWorkspaceUrl}>
              Reset Workspace URL
            </button>
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

  saveUrl = (event: any) => {
    event.preventDefault()

    const { workspaceUrl } = this.state
    if (!workspaceUrl) return

    try {
      Link.parse(workspaceUrl)
      this.loadWorkspaceUrl(workspaceUrl)
    } catch (e) {
      this.setState({ error: e.message })
    }
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "ShiftRight") {
      window.sendToEntry({
        type: "ToggleControl",
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
