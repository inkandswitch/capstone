import * as Preact from "preact"

import Store from "../data/Store"
import Root from "./Root"
import Content from "./Content"

import "./Archive"
import "./Board"
import "./Image"
import "./NetworkActivity"
import "./Text"
import "./Workspace"
import "./Shelf"
import "./Identity"
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import * as Archive from "./Archive"

// Used for debugging from the console:
window.Content = Content

Content.store = new Store()

type State = {
  url: string
}

export default class App extends Preact.Component<{}, State> {
  async initWorkspace() {
    const archiveUrlPromise = Content.create("Archive")
    const shelfUrlPromise = Content.create("Shelf")
    const identityUrlPromise = Content.create("Identity")

    const shelfUrl = await shelfUrlPromise
    const archiveUrl = await archiveUrlPromise
    const identityUrl = await identityUrlPromise
    const workspaceUrl = await Content.create("Workspace")
    Content.workspaceUrl = workspaceUrl

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, async (change: Function) => {
      const shelfUrl = await shelfUrlPromise
      const archiveUrl = await archiveUrlPromise

      change((workspace: any) => {
        if (!workspace.archiveUrl) {
          workspace.archiveUrl = archiveUrl
          workspace.shelfUrl = shelfUrl
          workspace.navStack = []
        }
      })

      this.setState({ url: workspaceUrl })
      chrome.storage.local.set({ workspaceUrl })
    })

    Content.once<Archive.Model>(archiveUrl, async (change: Function) => {
      change((archive: any) => {
        archive.docs.unshift({ url: identityUrl })
      })
    })
  }

  constructor() {
    super()
    // initialize the workspace at startup (since we have no persistence)
    chrome.storage.local.get(["workspaceUrl"], val => {
      if (val.workspaceUrl == undefined) {
        this.initWorkspace()
      } else {
        Content.workspaceUrl = val.workspaceUrl
        this.setState({ url: val.workspaceUrl })
      }
    })
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
