import * as React from "react"
import * as PinchMetrics from "../logic/PinchMetrics"
import Pinchable from "./Pinchable"
import Content, { Mode } from "./Content"

export type NavEntry = { url: string; [extra: string]: any }

interface Props {
  navStack: NavEntry[]
  rootUrl: string
  mode: Mode
  onNavForward: (url: string, extraProps?: {}) => void
  onNavBackward: () => void
}

interface State {
  pinch?: PinchMetrics.Measurements
}

export default class ZoomNav extends React.Component<Props, State> {
  peek = () => {
    const { navStack, rootUrl } = this.props
    return navStack[navStack.length - 1] || { url: rootUrl }
  }

  getPrevious = () => {
    const { navStack, rootUrl } = this.props
    if (navStack.length === 0) {
      return
    } else if (navStack.length === 1) {
      return { url: rootUrl }
    } else {
      return navStack[navStack.length - 2]
    }
  }

  render() {
    const { url: currentUrl, ...currentExtra } = this.peek()
    const previous = this.getPrevious()

    return (
      <>
        {previous ? (
          <Content
            key={previous.url + "-previous"} // Force a remount.
            mode={this.props.mode}
            url={previous.url}
            zIndex={-1}
          />
        ) : null}
        <Content
          key={currentUrl}
          mode={this.props.mode}
          url={currentUrl}
          {...currentExtra}
          onNavigate={this.props.onNavForward}
          onNavigateBack={this.props.onNavBackward}
        />
      </>
    )
  }
}
