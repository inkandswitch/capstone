import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"

import { ControlProps, ControlState } from "../apps/shared/command"

import FullscreenToggle from "./FullscreenToggle"
import WorkspaceMgr from "./WorkspaceMgr"
import DebugMgr from "./DebugMgr"

export default class ControlPanel extends React.Component<ControlProps> {
  render() {
    return (
      <div style={{ align: "center" }} >
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
