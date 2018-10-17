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
import "./HTML"
import * as Feedback from "./CommandFeedback"
import * as Workspace from "./Workspace"
import GlobalKeyboard from "./GlobalKeyboard"

import * as Debug from "debug"
const log = Debug("component:app")

type State = { }

type Props = { url: string }

export default class App extends React.Component<Props, State> {

  componentWillReceiveProps(nextProps : Props) {
    log("component will receive props", nextProps)
    if (nextProps.url != this.props.url) {
      this.initWorkspace(nextProps.url)
    }
  }

  initWorkspace(workspaceUrl : string) {
    const handle = Content.handle<Workspace.Model>(workspaceUrl)
    handle.once("doc", doc => {
      log("doc", doc, this.props.url)
      const shelfUrl = doc.shelfUrl || Content.create("Shelf")
      const rootUrl = doc.rootUrl || Content.create("Board")
      if (doc.rootUrl === "") {
        log("doc is blank - initializing", this.props.url)
        handle.change(doc => {
          doc.shelfUrl = shelfUrl
          doc.rootUrl = rootUrl
        })
      }
      Content.workspaceUrl = workspaceUrl
      Content.rootBoardUrl = rootUrl
    })
  }

  componentDidMount() {
    log("component did mount", this.props.url)

    this.initWorkspace(this.props.url)

    // subscribe to the web clipper for messages about new content
    Content.store.clipper().subscribe(message => {
      if (!message) return

      const { contentType, content } = message

      switch (contentType) {
        case "HTML":
          const htmlUrl = Content.create("HTML")

          Content.once(htmlUrl, (change: Function) => {
            change((doc: any) => {
              doc.html = content
            })

            Content.send({
              type: "ReceiveDocuments",
              body: { urls: [htmlUrl] },
            })
          })
          break

        case "Text":
          const textUrl = Content.create("Text")
          Content.once(textUrl, (change: Function) => {
            change((doc: any) => {
              doc.content = content.split("")
            })

            Content.send({
              type: "ReceiveDocuments",
              body: { urls: [textUrl] },
            })
          })
          break

        case "Image":
          const imageUrl = Content.create("Image")
          Content.once(imageUrl, (change: Function) => {
            change((doc: any) => {
              doc.src = content
            })

            Content.send({
              type: "ReceiveDocuments",
              body: { urls: [imageUrl] },
            })
          })
          break
      }
    })
  }

  render() {
    const { url } = this.props
    log("render", url)
    log("render-props", this.props)
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
