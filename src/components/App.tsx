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
import "./Shelf"
import "./Identity"
import "./PeerStatus"
import "./Peer"
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

type State = {
  url?: string
}

type Props = {}

export default class App extends React.Component<Props, State> {
  async initWorkspace() {
    const shelfUrlPromise = Content.create("Shelf")
    const rootBoardUrlPromise = Content.create("Board")

    const shelfUrl = await shelfUrlPromise
    const rootBoardUrl = await rootBoardUrlPromise
    const workspaceUrl = await Content.create("Workspace")
    Content.workspaceUrl = workspaceUrl

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, async (change: Function) => {
      change((workspace: EditDoc<Workspace.Model>) => {
        if (!workspace.identityUrl) {
          workspace.shelfUrl = shelfUrl
          workspace.rootUrl = rootBoardUrl
          workspace.navStack = [rootBoardUrl]
        }
      })

      this.setState({ url: workspaceUrl })
      localStorage.workspaceUrl = workspaceUrl
    })
  }

  constructor(props: Props) {
    super(props)
    // initialize the workspace at startup (since we have no persistence)
    const { workspaceUrl } = localStorage
    if (workspaceUrl == undefined) {
      this.initWorkspace()
    } else {
      Content.open<Workspace.Model>(
        workspaceUrl,
        (workspace: Doc<Workspace.Model>) => {
          Content.workspaceUrl = workspaceUrl
          this.setState({ url: workspaceUrl })
        },
      )
    }

    this.state = { url: undefined }
  }

  render() {
    const { url } = this.state
    console.log("APP RENDER", url)
    if (!url) {
      return null
    }

    return (
      <Root store={Content.store}>
        <div style={style.App}>
          <Stats />
          <GlobalKeyboard onKeyDown={this.onKeyDown} />
          <Content mode="fullscreen" url={url} />
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
