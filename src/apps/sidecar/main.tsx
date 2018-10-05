import * as Preact from "preact"
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

setTimeout(() => Preact.render(<SidecarApp />, document.body), 1000)
