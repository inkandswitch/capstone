import * as Preact from "preact"
import * as Rx from "rxjs"

import Content from "./Content"
import { Glyph, GlyphEvent } from "./StrokeRecognizer"

import * as css from "./css/Peers.css"

interface State {
  peers: {}
}

export default class Peers extends Preact.Component<{}, State> {
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

  onGlyph = (stroke: GlyphEvent, url: string) => {}
  onDoubleTap = (url: string) => {}
  render() {
    const { peers } = this.state
    return (
      <div className={css.Peers}>
        {Object.entries(peers).map(([id, peer]) => {
          return <Content mode="embed" type="Peer" url={id} />
        })}
      </div>
    )
  }
}
