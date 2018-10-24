import * as React from "react"
import { Doc, EditDoc } from "automerge/frontend"

import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./SidecarWorkspace"
import "./Text"
import "./HTML"
import "./Table"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

type State = {
  workspaceUrl?: string
  mode: "loading" | "setup" | "ready"
  error?: string
}

export default class SidecarApp extends React.Component<{}, State> {
  state: State = { mode: "loading" }

  initWorkspace() {
    console.log("init workspace")
    const shelfUrl = Content.create("Board")
    const rootBoardUrl = Content.create("Board")
    const workspaceUrl = Content.create("Workspace")

    Content.workspaceUrl = workspaceUrl
    Content.rootBoardUrl = rootBoardUrl

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, (change: Function) => {
      change((workspace: EditDoc<Workspace.Model>) => {
        if (!workspace.identityUrl) {
          workspace.shelfUrl = shelfUrl
          workspace.rootUrl = rootBoardUrl
          workspace.navStack = []
        }
      })

      this.setWorkspaceUrl(workspaceUrl)
    })
  }

  setWorkspaceUrl(workspaceUrl: string) {
    console.log("set workspace", workspaceUrl)
    this.setState({ workspaceUrl })
    Content.store.setWorkspace(workspaceUrl)
  }

  openWorkspace(workspaceUrl: string) {
    console.log("open workspace 1", workspaceUrl)
    Content.open<Workspace.Model>(
      workspaceUrl,
      (workspace: Doc<Workspace.Model>) => {
        console.log("open workspace 2", workspaceUrl)
        Content.workspaceUrl = workspaceUrl
        Content.rootBoardUrl = workspace.rootUrl

        this.setWorkspaceUrl(workspaceUrl)
      },
    )
  }

  configWorkspace(workspaceUrl: string | null) {
    console.log("config workspace", workspaceUrl, typeof workspaceUrl)
    workspaceUrl ? this.openWorkspace(workspaceUrl) : this.initWorkspace()
  }

  componentDidMount() {
    console.log("Sidecar start", Content.store.getWorkspace())

    this.configWorkspace(Content.store.getWorkspace())

    Content.store.control().subscribe(message => {
      if (!message) return

      if (message.url) {
        this.setState({ mode: "ready", workspaceUrl: message.url })
      } else {
        this.setState({ mode: "setup" })
      }
    })

    Content.store.clipper().subscribe(message => {
      if (!message) return

      const { contentType, content, src } = message

      switch (contentType) {
        case "HTML":
          const htmlUrl = Content.create("HTML")

          Content.once(htmlUrl, (change: Function) => {
            change((doc: any) => {
              doc.html = content
              doc.src = src
            })

            Content.send({
              type: "ReceiveDocuments",
              body: { urls: [htmlUrl] },
            })
          })
          break

        case "Text":
          const textUrl = Content.create("Text")
          Content.once(textUrl, (change: Function) => {
            change((doc: any) => {
              doc.content = content.split("")
            })

            Content.send({
              type: "ReceiveDocuments",
              body: { urls: [textUrl] },
            })
          })
          break

        case "Image":
          const imageUrl = Content.create("Image")
          Content.once(imageUrl, (change: Function) => {
            change((doc: any) => {
              doc.src = content
            })

            Content.send({
              type: "ReceiveDocuments",
              body: { urls: [imageUrl] },
            })
          })
          break
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
      Content.store.setWorkspace(workspaceUrl)
    } catch (e) {
      this.setState({ error: e.message })
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
