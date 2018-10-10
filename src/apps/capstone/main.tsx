import * as React from "react"
import * as ReactDOM from "react-dom"
import App from "../../components/App"
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

setTimeout(() => ReactDOM.render(<App />, document.body), 1000)
