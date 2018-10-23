import * as React from "react"

import Root from "./Root"
import Content from "./Content"
import Stats from "./Stats"
import * as Debug from "debug"
import * as css from "./css/App.css"

import "./Board"
import "./Image"
import "./Text"
import "./Table"
import "./Workspace"
import "./HTML"
import "./Bot"

import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

const log = Debug("component:app")

type State = {
  url?: string
  shouldHideFPSCounter?: boolean
}

export default class App extends React.Component<State> {
  state: State = {}

  initWorkspace() {
    log("init workspace")
    const url = Content.create("Workspace")
    this.setState({
      url: url,
      shouldHideFPSCounter: Content.store.shouldHideFPSCounter(),
    })

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

    Content.store.fpsToggle().subscribe(message => {
      if (!message) return

      if (message.type == "Toggle") {
        this.setState({ shouldHideFPSCounter: message.state })
      }
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
    const { url, shouldHideFPSCounter } = this.state
    log("render", url)

    if (!url) {
      return null
    }

    return (
      <Root store={Content.store}>
        <div className={css.App}>
          {Content.env.device === "capstone" && !shouldHideFPSCounter ? (
            <Stats />
          ) : null}
          <Content mode="fullscreen" url={url} />
        </div>
      </Root>
    )
  }
}
