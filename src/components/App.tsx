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
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"
import "../styles/styles.css"

import * as Debug from "debug"
const log = Debug("component:app")

type State = {
  url?: string
}

type Props = {}

export default class App extends React.Component<Props, State> {
  state: State = {}

  initWorkspace() {
    log("init workspace")
    const url = Content.create("Workspace")
    this.setState({ url })

    setTimeout(() => {
      // This fn is triggered by the same observable setWorkspace writes to.
      // Without the timeout, some receive the workspace in the wrong order
      Content.store.setWorkspace(url)
    }, 0)
  }

  openWorkspace(url: string) {
    log("open workspace 1", url)
    this.setState({ url })
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
          Content.change(htmlUrl, doc => {
            doc.html = content
            doc.src = src
          })
          Content.send({
            type: "ReceiveDocuments",
            body: { urls: [htmlUrl] },
          })
          break

        case "Text":
          const textUrl = Content.create("Text")
          Content.change(textUrl, doc => {
            doc.content = content.split("")
          })
          Content.send({
            type: "ReceiveDocuments",
            body: { urls: [textUrl] },
          })
          break

        case "Image":
          const imageUrl = Content.create("Image")
          Content.change(imageUrl, (doc: any) => {
            doc.src = content
          })
          Content.send({
            type: "ReceiveDocuments",
            body: { urls: [imageUrl] },
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
          {Content.env.device === "capstone" ? <Stats /> : null}
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
