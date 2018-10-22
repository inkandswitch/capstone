import * as React from "react"
import { Doc, EditDoc } from "automerge/frontend"

import Root from "./Root"
import Content from "./Content"
import Stats from "./Stats"
import * as Link from "../data/Link"
import * as UUID from "../data/UUID"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./Text"
import "./Table"
import "./Workspace"
import "./Shelf"
import "./Identity"
import "./PeerStatus"
import "./Peer"
import "./HTML"
import "./REPL"
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

import * as Debug from "debug"
const log = Debug("component:app")

type State = {
  url?: string
}

type Props = {}

window.hooks = {}

export default class App extends React.Component<Props, State> {
  state: State = {}

  initWorkspace() {
    const shelfUrl = Content.create("Shelf")
    const rootBoardUrl = Content.create("Board")
    const workspaceUrl = Content.create("Workspace")
    const replUrl = Content.create("REPL")

    Content.workspaceUrl = workspaceUrl
    Content.rootBoardUrl = rootBoardUrl
    Content.replUrl = replUrl

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, (change: Function) => {
      change((workspace: EditDoc<Workspace.Model>) => {
        workspace.shelfUrl = shelfUrl
        workspace.rootUrl = rootBoardUrl
        workspace.replUrl = replUrl
        workspace.navStack = []
        workspace.comands = []
      })

      this.setState({ url: workspaceUrl })

      localStorage.workspaceUrl = workspaceUrl

      Content.once(rootBoardUrl, (change: Function) => {
        change((rootBoard: any) => {
          const id = UUID.create()

          rootBoard.cards[id] = {
            id,
            url: replUrl,
            type: "REPL",
            x: 100,
            y: 100,
            width: 300,
            height: 500,
          }
        })
      })
    })
  }

  componentDidMount() {
    const { workspaceUrl } = localStorage
    if (workspaceUrl == undefined) {
      this.initWorkspace()
    } else {
      Content.open<Workspace.Model>(
        workspaceUrl,
        (workspace: Doc<Workspace.Model>) => {
          Content.workspaceUrl = workspaceUrl
          Content.rootBoardUrl = workspace.rootUrl
          Content.replUrl = workspace.replUrl

          this.setState({ url: workspaceUrl })
        },
      )
    }

    // subscribe to the web clipper for messages about new content
    Content.store.clipper().subscribe(message => {
      if (!message) return

      const { contentType, content } = message

      switch (contentType) {
        case "HTML":
          const htmlUrl = Content.create("HTML")

          Content.once(htmlUrl, (change: Function) => {
            change((doc: any) => {
              doc.html = content
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
          <GlobalKeyboard onKeyDown={this.onKeyDown} />
          <Content mode="fullscreen" url={url} />
          <Content mode="embed" url={Link.setType(url, "REPL")} />
          <Feedback.Renderer />
        </div>
      </Root>
    )
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "ShiftRight") {
      Content.store.sendToBackend({ type: "ToggleDebug" })
    }
  }
}

const style = {
  App: {
    fontFamily: "Roboto, Arial, Helvetica, sans-serif",
    overflow: "hidden",
  },
}
