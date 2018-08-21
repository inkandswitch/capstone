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
  constructor() {
    super()

    var swarm = require("discovery-swarm")

    var sw = swarm({ utp: false })

    sw.listen(1001)
    sw.join("quelle-disastre") // can be any id/name/hash

    sw.on("connection", function(connection: any) {
      console.log("found + connected to peer")
    })

    // initialize the workspace at startup (since we have no persistence)
    let workspaceUrl = Content.create("Workspace")
    let archiveUrl = Content.create("Archive")
    workspaceUrl
      .then(workspaceUrl => {
        return Content.open<Workspace.Model>(workspaceUrl)
      })
      .then(workspace => {
        Promise.all([workspaceUrl, archiveUrl]).then(([workspaceUrl, archiveUrl]) => {
          const { type, id } = Link.parse(workspaceUrl)
          Content.store.change(id, workspace, "adding initial urls", doc => {
            doc.boardUrl = Link.format({ type: "Board", id: "id1" }) // use sample data
            doc.archiveUrl = archiveUrl
            return doc
          })
        })
        return workspaceUrl
      })
      .then(workspaceUrl => this.setState({ url: workspaceUrl }))
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
  },
}
