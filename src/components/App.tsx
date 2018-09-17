import * as Preact from "preact"

import Store from "../data/Store"
import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Archive"
import "./Board"
import "./Image"
import "./Text"
import "./Workspace"
import "./Shelf"
import * as Workspace from "./Workspace"

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

    const workspaceUrl = await Content.create("Workspace")
    Content.workspaceUrl = workspaceUrl

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, async (workspace, change) => {
      const shelfUrl = await shelfUrlPromise
      const archiveUrl = await archiveUrlPromise

      if (!workspace.archiveUrl) {
        workspace.archiveUrl = archiveUrl
        workspace.shelfUrl = shelfUrl
        change(workspace)
      }

      this.setState({ url: workspaceUrl })
      chrome.storage.local.set({ workspaceUrl })
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
    console.log("APP RENDER",url)
    if (!url) {
      return null
    }
    return (
      <Root store={Content.store}>
        <div style={style.App}>
          <Content mode="fullscreen" url={url} />
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
