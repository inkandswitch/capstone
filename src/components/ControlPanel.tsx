import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"

import FullscreenToggle from "./FullscreenToggle"
import WorkspaceMgr from "./WorkspaceMgr"
import DebugMgr from "./DebugMgr"
import StoreBackend from "../data/StoreBackend"

type Props = {
  store: StoreBackend
}

export default class ControlPanel extends React.Component<Props> {
  render() {
    return (
      <div>
        <FullscreenToggle />
        <hr />
        <DebugMgr {...this.props} />
        <hr />
        <WorkspaceMgr {...this.props} />
        <hr />
      </div>
    )
  }
}
