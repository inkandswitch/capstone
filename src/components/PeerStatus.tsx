import classnames from "classnames"
import * as Preact from "preact"

import * as Link from "../data/Link"
import Store from "../data/Store"
import Content, { Mode } from "./Content"
import * as css from "./css/PeerStatus.css"

interface Props {
  store: Store
  mode: Mode
  url: string
}

interface State {
  connectionCount: number
  status: string
}

// TODO: move to store
type status = "inactive" | "active" | "red?"

export default class PeerStatus extends Preact.Component<Props, State> {
  id = Link.parse(this.props.url).id
  state = { connectionCount: 0, status: "inactive" }
  static reify() {
    return {}
  }

  componentDidMount() {
    // TODO: subscribe to peer activity
    this.props.store.presence().subscribe(this.onUpdate)
  }

  onUpdate = (presence: any) => {
    const peer = presence.peers[this.props.url]
    let connectionCount = 0
    let status = "inactive"
    if (peer) {
      console.log(peer)
      status = +Date.now() - peer.lastSeen > 10000 ? "inactive" : "active"
      connectionCount = peer.devices.length
    }
    this.setState({ connectionCount, status })
  }

  render() {
    const { connectionCount, status } = this.state
    const statusClassName = classnames(css.Status, {
      [css.StatusActive]: status === "active",
      [css.StatusInactive]: status === "inactive",
      [css.StatusError]: status === "red?",
    })
    return (
      <div className={css.PeerStatus}>
        <div className={statusClassName} />
        <div className={css.ConnectionCount}>{connectionCount}</div>
      </div>
    )
  }
}

Content.registerWidget("PeerStatus", PeerStatus)
