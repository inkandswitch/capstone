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

type Props = {
  url: string
}
type State = {
  workspaceUrl: string
  mode: "loading" | "setup" | "ready"
  error?: string
}

export default class SidecarApp extends React.Component<Props, State> {
  constructor(props: Props, ctx: any) {
    super(props, ctx)

    const { workspaceUrl } = localStorage

    this.state = { mode: "loading", workspaceUrl: this.props.url }

    this.state = {
      mode: "ready",
      workspaceUrl,
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
        return (
          <div>
            <Content
              mode="fullscreen"
              url={Link.setType(workspaceUrl, "SidecarWorkspace")}
            />
          </div>
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
