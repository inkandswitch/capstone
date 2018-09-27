import classnames from "classnames"
import * as Preact from "preact"
import * as Rx from "rxjs"

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
  status: string
}

// TODO: move to store
type status = "inactive" | "active" | "disconnected"

export default class PeerStatus extends Preact.Component<Props, State> {
  id = Link.parse(this.props.url).id
  state = { status: "disconnected" }
  presenceSubscription: Rx.Subscription
  static reify() {
    return {}
  }

  componentDidMount() {
    // TODO: subscribe to peer activity
    this.presenceSubscription = this.props.store
      .presence()
      .subscribe(this.onUpdate)
  }

  componentWillUnmount() {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe()
    }
  }

  onUpdate = (presence: any) => {
    if (presence === null) return
    const peer = presence.peers[this.props.url]
    let status = "disconnected"
    if (peer) {
      console.log(peer)
      status = +Date.now() - peer.lastSeen > 10000 ? "inactive" : "active"
    }
    this.setState({ status })
  }

  render() {
    const { status } = this.state
    const statusClassName = classnames(css.Status, {
      [css.StatusActive]: status === "active",
      [css.StatusInactive]: status === "inactive",
      [css.StatusDisconnected]: status === "disconnected",
    })
    return (
      <div className={css.PeerStatus}>
        <div className={statusClassName} />
      </div>
    )
  }
}

Content.registerWidget("PeerStatus", PeerStatus)
