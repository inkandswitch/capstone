import * as React from "react"
import * as ReactDOM from "react-dom"
import SidecarApp from "../../components/SidecarApp"
import Content from "../../components/Content"
import Store from "../../data/Store"

// Used for debugging from the console:
window.Content = Content

const port = chrome.runtime.connect()

Content.store = new Store(msg => {
  port.postMessage(msg)
})

port.onMessage.addListener(msg => {
  Content.store.onMessage(msg)
})

ReactDOM.render(<SidecarApp />, document.body)
