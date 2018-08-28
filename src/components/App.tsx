import * as Preact from "preact"

import Store from "../data/Store"
import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./Text"
import "./Workspace"
import * as Workspace from "./Workspace"

// Used for debugging from the console:
window.Content = Content

Content.store = new Store()

type State = {
  url: string
}

export default class App extends Preact.Component<{}, State> {
  initWorkspace() {
    let workspaceUrl = Content.create("Workspace")
    let archiveUrl = Content.create("Archive")
    let boardUrl = Content.create("Board")
    workspaceUrl
      .then(workspaceUrl => {
        return Content.open<Workspace.Model>(workspaceUrl)
      })
      .then(workspace => {
        Promise.all([workspaceUrl, archiveUrl,boardUrl]).then(
          ([workspaceUrl, archiveUrl, boardUrl]) => {
            const { type, id } = Link.parse(workspaceUrl)
            Content.store.change(id, workspace, "adding initial urls", doc => {
              doc.currentUrl = boardUrl
              doc.archiveUrl = archiveUrl
              return doc
            })
          },
        )
        return workspaceUrl
      })
      .then(workspaceUrl => {
        this.setState({ url: workspaceUrl })
        chrome.storage.local.set({ workspaceUrl })
      })
  }
  constructor() {
    super()
    // initialize the workspace at startup (since we have no persistence)
    chrome.storage.local.get(["workspaceUrl"],(val) => {
      if (val.workspaceUrl == undefined) {
        this.initWorkspace()
      } else {
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
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "auto",
  },
}
