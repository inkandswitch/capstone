import * as React from "react"

import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import * as Widget from "./Widget"
import Content from "./Content"
import * as css from "./css/Peer.css"

interface Model {
  name: string
}

class Peer extends React.Component<Widget.Props<Model>> {
  static reify(doc: AnyDoc) {
    return {
      name: Reify.string(doc.string),
    }
  }

  render() {
    return (
      <div className={css.Peer}>
        <div className={css.PeerName}>{this.props.doc.name || "anonymous"}</div>
        <Content mode="embed" type="PeerStatus" url={this.props.url} />
      </div>
    )
  }
}

export default Widget.create("Peer", Peer, Peer.reify)
