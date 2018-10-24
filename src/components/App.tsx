import * as React from "react"
import { Doc, EditDoc } from "automerge/frontend"

import Root from "./Root"
import Content from "./Content"
import Stats from "./Stats"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./Text"
import "./Table"
import "./Workspace"
import "./Identity"
import "./PeerStatus"
import "./Peer"
import "./HTML"
import "./Bot"
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

import * as Debug from "debug"
const log = Debug("component:app")

type State = {
  url?: string
}

type Props = {}

import * as UUID from "../data/UUID"
window.UUID = UUID

export default class App extends React.Component<Props, State> {
  state: State = {}

  initWorkspace() {
    log("init workspace")
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
    log("set workspace", workspaceUrl)
    this.setState({ url: workspaceUrl })
    Content.store.setWorkspace(workspaceUrl)
  }

  openWorkspace(workspaceUrl: string) {
    log("open workspace 1", workspaceUrl)
    Content.open<Workspace.Model>(
      workspaceUrl,
      (workspace: Doc<Workspace.Model>) => {
        log("open workspace 2", workspaceUrl)
        Content.workspaceUrl = workspaceUrl
        Content.rootBoardUrl = workspace.rootUrl

        this.setWorkspaceUrl(workspaceUrl)
      },
    )
  }

  configWorkspace(workspaceUrl: string | null) {
    log("config workspace", workspaceUrl, typeof workspaceUrl)
    workspaceUrl ? this.openWorkspace(workspaceUrl) : this.initWorkspace()
  }

  componentDidMount() {
    log("component did mount")
    this.configWorkspace(Content.store.getWorkspace())

    Content.store.control().subscribe(message => {
      if (!message || message.url == this.state.url) return
      log("on control msg", message.url)
      this.configWorkspace(message.url)
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
    const { url } = this.state
    log("render", url)

    if (!url) {
      return null
    }

    return (
      <Root store={Content.store}>
        <div style={style.App}>
          <Stats />
          <Content mode="fullscreen" url={url} />
          <Feedback.Renderer />
        </div>
      </Root>
    )
  }
}

const style = {
  App: {
    fontFamily: "Roboto, Arial, Helvetica, sans-serif",
    overflow: "hidden",
  },
}
