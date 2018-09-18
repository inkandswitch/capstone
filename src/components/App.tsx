import * as Preact from "preact"

import Store from "../data/Store"
import * as Link from "../data/Link"
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

    const shelfUrl = await shelfUrlPromise
    const archiveUrl = await archiveUrlPromise
    const workspaceUrl = await Content.create("Workspace")
    Content.workspaceUrl = workspaceUrl
    Content.archiveUrl = archiveUrl

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, async (workspace, change) => {
      if (!workspace.archiveUrl) {
        workspace.archiveUrl = archiveUrl
        workspace.shelfUrl = shelfUrl
        change(workspace)
      }

      this.setState({ url: workspaceUrl })
      chrome.storage.local.set({ workspaceUrl, archiveUrl })
    })
  }

  constructor() {
    super()
    // initialize the workspace at startup (since we have no persistence)
    chrome.storage.local.get(["workspaceUrl", "archiveUrl"], val => {
      if (val.workspaceUrl == undefined) {
        this.initWorkspace()
      } else {
        Content.workspaceUrl = val.workspaceUrl
        Content.archiveUrl = val.archiveUrl
        this.setState({ url: val.workspaceUrl })
      }
    })
  }
  render() {
    const { url } = this.state
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
