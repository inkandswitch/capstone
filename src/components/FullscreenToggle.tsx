import * as React from "react"

import * as Debug from "debug"

interface Props {}

export default class FullscreenToggle extends React.Component<Props> {
  handleClick = () => {
    const window = chrome.app.window.current()
    if (window.isFullscreen()) {
      window.restore()
      window.show()
      chrome.storage.local.set({ disableFullscreen: true })
    } else {
      window.fullscreen()
      chrome.storage.local.set({ disableFullscreen: false })
    }
  }

  render() {
    return <button onClick={this.handleClick}>Toggle Fullscreen</button>
  }
}
