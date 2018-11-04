import * as React from "react"
import WorkspaceMgr from "./WorkspaceMgr"
import DebugWidget from "./DebugWidget"
import DebugMgr from "./DebugMgr"
import { Store } from "capstone"
import EnvMgr from "./EnvMgr"
import * as css from "./css/ControlPanel.css"

type State = {
  url: string | null
  shouldHideFPSCounter: boolean | null
}

type Props = {
  store: Store
}

export default class ControlPanel extends React.Component<Props, State> {
  state = {
    url: null,
    shouldHideFPSCounter: null,
  }

  componentDidMount() {
    this.props.store.control().subscribe(message => {
      if (!message) return

      if (message.type == "Control") {
        this.setState({ url: message.url })
      }
    })

    this.props.store.fpsToggle().subscribe(message => {
      if (!message) return

      if (message.type == "Toggle") {
        this.setState({ shouldHideFPSCounter: message.state })
      }
    })
  }

  render() {
    return (
      <div>
        <DebugMgr {...this.props} />
        <hr className={css.Divider} />
        <EnvMgr />
        <hr className={css.Divider} />
        <WorkspaceMgr {...this.props} />
        <hr className={css.Divider} />
        {this.state.url ? (
          <DebugWidget store={this.props.store} url={this.state.url!} />
        ) : (
          " "
        )}
        <button
          onClick={this.toggleFPSCounter}
          style={{ position: "fixed", bottom: 10, right: 10 }}>
          {this.state.shouldHideFPSCounter
            ? "Show FPS counter"
            : "Hide FPS counter"}
        </button>
      </div>
    )
  }

  toggleFPSCounter = () => {
    this.props.store.toggleFPSCounter()
  }
}
