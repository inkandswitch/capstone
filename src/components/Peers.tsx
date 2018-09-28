import * as Preact from "preact"
import * as Rx from "rxjs"

import Content from "./Content"
import Touch from "./Touch"

import * as css from "./css/Peers.css"

interface Props {
  onTapPeer: (url: string) => void
}

interface State {
  peers: {}
}

export default class Peers extends Preact.Component<Props, State> {
  state = { peers: {} }
  presenceSubscription: Rx.Subscription

  componentDidMount() {
    // TODO: subscribe to peer activity
    this.presenceSubscription = Content.store
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
    this.setState({
      peers: presence.peers,
    })
  }

  onTap = (url: string) => {
    this.props.onTapPeer(url)
  }

  render() {
    const { peers } = this.state
    return (
      <div className={css.Peers}>
        {Object.entries(peers).map(([id, peer]) => (
          <Touch onTap={() => this.onTap(id)}>
            <div>
              <Content mode="embed" type="Peer" url={id} />
            </div>
          </Touch>
        ))}
      </div>
    )
  }
}
