import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"

import FullscreenToggle from "./FullscreenToggle"
import WorkspaceMgr from "./WorkspaceMgr"
import DebugWidget from "./DebugWidget"
import DebugMgr from "./DebugMgr"
import Store from "../data/Store"
import EnvMgr from "./EnvMgr"

type State = {
  url: string | null
}

type Props = {
  store: Store
}

export default class ControlPanel extends React.Component<Props, State> {
  state = {
    url: null,
  }

  componentDidMount() {
    this.props.store.control().subscribe(message => {
      if (!message) return

      if (message.type == "Control") {
        this.setState({ url: message.url })
      }
    })
  }

  render() {
    return (
      <div>
        <DebugMgr {...this.props} />
        <hr />
        <EnvMgr />
        <hr />
        <WorkspaceMgr {...this.props} />
        <hr />
        {this.state.url ? (
          <DebugWidget store={this.props.store} url={this.state.url!} />
        ) : (
          " "
        )}
      </div>
    )
  }
}
