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
  initWorkspace() {
    let archiveUrl = Content.create("Archive")
    let boardUrl = Content.create("Board")
    let shelfUrl = Content.create("Shelf")

    Content.create("Workspace").then(workspaceUrl => {
      let workspaceUpdateFunction = Content.open<Workspace.Model>(
        workspaceUrl,
        (workspaceDoc: any) => {
          Promise.all([archiveUrl, boardUrl, shelfUrl]).then(
            ([archiveUrl, boardUrl, shelfUrl]) => {
              // this is pretty yeeeech, but i'm leaving it since it should be replaced
              // by jeff's RxJS patch
              // what we want here is sort of a .once('update') style callback,
              // probably from create() itself
              if (workspaceDoc.archiveUrl) return
              workspaceDoc.currentUrl = boardUrl
              workspaceDoc.archiveUrl = archiveUrl
              workspaceDoc.shelfUrl = shelfUrl
              workspaceUpdateFunction(workspaceDoc)
              this.setState({ url: workspaceUrl })
              chrome.storage.local.set({ workspaceUrl })
            },
          )
        },
      )
    })
  }

  constructor() {
    super()
    // initialize the workspace at startup (since we have no persistence)
    chrome.storage.local.get(["workspaceUrl"], val => {
      if (val.workspaceUrl == undefined) {
        this.initWorkspace()
      } else {
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
