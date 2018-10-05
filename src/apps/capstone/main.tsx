import * as Preact from "preact"
import App from "../../components/App"
import Content from "../../components/Content"
import Store from "../../data/Store"
import installRenderErrorHandler from "../../modules/preact-render-error"

// XXX: Remove once preact has error boundaries (or we switch to react)
installRenderErrorHandler()

// Used for debugging from the console:
window.Content = Content

const port = chrome.runtime.connect()

Content.store = new Store(msg => {
  port.postMessage(msg)
})

port.onMessage.addListener(msg => {
  Content.store.onMessage(msg)
})

setTimeout(() => Preact.render(<App />, document.body), 1000)
