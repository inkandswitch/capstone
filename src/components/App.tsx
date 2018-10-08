import * as React from "react"
import { Doc, EditDoc } from "automerge/frontend"

import Store from "../data/Store"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./NetworkActivity"
import "./Text"
import "./Workspace"
import "./Shelf"
import "./Identity"
import "./PeerStatus"
import "./Peer"
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import * as Identity from "./Identity"

// Used for debugging from the console:
window.Content = Content

Content.store = new Store()

Content.store.presence().subscribe(presenceInfo => {
  console.log(presenceInfo)
})

type State = {
  url?: string
}

type Props = {}

export default class App extends React.Component<Props, State> {
  async initWorkspace() {
    const shelfUrlPromise = Content.create("Shelf")
    const identityUrlPromise = Content.create("Identity")
    const rootBoardUrlPromise = Content.create("Board")

    const shelfUrl = await shelfUrlPromise
    const identityUrl = await identityUrlPromise
    const rootBoardUrl = await rootBoardUrlPromise
    const workspaceUrl = await Content.create("Workspace")
    Content.workspaceUrl = workspaceUrl
    Content.store.setIdentity(identityUrl)

    Content.store.clipper().subscribe(async ({ request }) => {
      const textUrlPromise = Content.create("Text")
      const textUrl = await textUrlPromise

      Content.once(textUrl, async (change: Function) => {
        change((doc: any) => {
          doc.content = request.html
        })

        console.log("text url", textUrl)
        Content.send({ type: "AddToShelf", body: { url: textUrl } })
      })
    })

    // Initialize the workspace
    Content.once<Workspace.Model>(workspaceUrl, async (change: Function) => {
      change((workspace: EditDoc<Workspace.Model>) => {
        if (!workspace.identityUrl) {
          workspace.identityUrl = identityUrl
          workspace.shelfUrl = shelfUrl
          workspace.rootUrl = rootBoardUrl
          workspace.navStack = [rootBoardUrl]
        }
      })

      this.setState({ url: workspaceUrl })
      chrome.storage.local.set({ workspaceUrl })
    })

    Content.send({
      to: rootBoardUrl,
      type: "ReceiveDocuments",
      body: { urls: [identityUrl] },
    })

    Content.once<Identity.Model>(identityUrl, async (change: Function) => {
      change((identity: any) => {
        identity.mailboxUrl = shelfUrl
      })
    })
  }

  constructor(props: Props) {
    super(props)
    // initialize the workspace at startup (since we have no persistence)
    chrome.storage.local.get(["workspaceUrl"], val => {
      if (val.workspaceUrl == undefined) {
        this.initWorkspace()
      } else {
        Content.open<Workspace.Model>(
          val.workspaceUrl,
          (workspace: Doc<Workspace.Model>) => {
            Content.workspaceUrl = val.workspaceUrl
            Content.store.setIdentity(workspace.identityUrl)
            this.setState({ url: val.workspaceUrl })
          },
        )
      }
    })

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
