import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../data/Link"

import { ControlProps, ControlState } from "../apps/shared/command"

import FullscreenToggle from "./FullscreenToggle"
import WorkspaceMgr from "./WorkspaceMgr"

export default class ControlPannel extends React.Component<ControlProps> {
  render() {
    return (
      <div>
        <FullscreenToggle />
        <WorkspaceMgr {...this.props} />
      </div>
    )
  }
}
