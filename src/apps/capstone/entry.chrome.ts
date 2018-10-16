import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import CloudClient from "../../modules/discovery-cloud/Client"

import DebugPane from "../../components/DebugPane"
import * as React from "react"
import * as ReactDOM from "react-dom"

let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")

const webview = document.getElementById("webview")! as HTMLIFrameElement
const DebugPaneDom = document.getElementById("DebugPane")!

const hm = new Hypermerge({ storage: racf })
const store = new StoreBackend(hm)

store.sendQueue.subscribe(msg => {
  webview.contentWindow!.postMessage(msg, "*")
})

window.addEventListener("message", event => {
  if (event.data.type === "ToggleDebug") {
    toggleDebug()
  }

  store.onMessage(event.data)
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    toggleDebug()
  }
})

webview.addEventListener("loadstop", () => {
  webview.focus()

  hm.joinSwarm(new CloudClient({
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
    id: hm.id,
    stream: hm.stream,
  }))

  store.sendToFrontend({ type: "Ready" })

  setDebugPannel()

  const paneWidget = React.createElement(DebugPane, { hello: "world" }, null)
  ReactDOM.render(paneWidget, DebugPaneDom)
})

function setDebugPannel() {
  chrome.storage.local.get("debugPannel", data => {
    DebugPaneDom.style.display = data.debugPannel
  })
  DebugPaneDom.style.display =
    DebugPaneDom.style.display === "block" ? "none" : "block"
}

function toggleDebug() {
  console.log("Toggling debug pane")
  const mode = DebugPaneDom.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({debugPannel: mode})
  setDebugPannel()
}

// Receive messages from the Clipper chrome extension to import content
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (sender.id == "blocklistedExtension") return

    console.log("Received message from external extension", request, sender)

    store.sendToFrontend({ type: "Clipper", ...request })

    sendResponse({ contentReceived: "success" })
  },
)
