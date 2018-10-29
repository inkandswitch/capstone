import * as React from "react"
import * as Link from "../data/Link"

import Store from "../data/Store"
import { Doc, FrontendManager } from "../modules/hypermerge"
import * as Debug from "debug"
const log = Debug("component:control:widget")

type Props = {
  store: Store
  url: string
}

type State = {
  url: string
  json: string
  manager: FrontendManager<unknown>
  peers: number
  feeds: number
}

export default class DebugWidget extends React.Component<Props, State> {
  state = {
    url: this.props.url,
    json: "",
    manager: this.props.store.manager(Link.parse(this.props.url).id),
    peers: this.props.store.peerCount[Link.parse(this.props.url).id] || 0,
    feeds: this.props.store.feedCount[Link.parse(this.props.url).id] || 0,
  }

  docListener = (doc: Doc<unknown>) => {
    const json = JSON.stringify(doc, undefined, 2)
    this.setState({ json })
  }

  infoListener = (peers: number, feeds: number) => {
    this.setState({ peers, feeds })
  }

  componentDidMount() {
    this.state.manager.on("doc", this.docListener)
    this.state.manager.on("info", this.infoListener)
  }

  jsonComponent() {
    const chunks = this.state.json
      .split('"')
      .map((chunk: string, i: number) => {
        if (chunk.startsWith("capstone://")) {
          return (
            <a key={i} href={"#"} onClick={this.pushUrlFn(chunk)}>
              {chunk}
            </a>
          )
        } else {
          return chunk
        }
      })
    return <pre> {chunks} </pre>
  }

  resetUrl = () => {
    this.pushUrl(this.props.url)
  }

  pushUrlFn = (url: string) => {
    return () => this.pushUrl(url)
  }

  pushUrl = (url: string) => {
    this.state.manager.removeListener("doc", this.docListener)
    this.state.manager.removeListener("info", this.infoListener)

    const docId = Link.parse(url).id
    const manager = this.props.store.manager(docId)
    manager.on("doc", this.docListener)
    manager.on("info", this.infoListener)

    this.setState({ url, manager })
  }

  render() {
    log(this.state)
    return (
      <div>
        <div>
          {" "}
          {this.state.url} |{" "}
          {this.state.url === this.props.url ? (
            ""
          ) : (
            <a href={"#"} onClick={this.resetUrl}>
              {"reset"}
            </a>
          )}{" "}
        </div>
        <div>
          {" "}
          peers: {this.state.peers} | feeds: {this.state.feeds}{" "}
        </div>
        {this.jsonComponent()}
      </div>
    )
  }
}
