import Queue from "../../data/Queue"
import * as Msg from "../../data/StoreMsg"
import { setupControlPanel, toggleControl } from "./control"

const webview = document.getElementById("webview")! as HTMLIFrameElement

const mainQueue = new Queue<Msg.EntryToMain>()

function sendToMain(msg: Msg.EntryToMain) {
  mainQueue.push(msg)
}

window.addEventListener("message", event => {
  if (typeof event !== "object") return
  const msg: Msg.ToEntry = event.data

  switch (msg.type) {
    case "ToggleControl":
      // toggleControl()
      break

    case "Clipper":
      sendToMain(msg)
      break
  }
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    // toggleControl()
  }
})

let loadStopped = false
webview.addEventListener("loadstop", () => {
  if (loadStopped) return

  loadStopped = true

  webview.focus()

  mainQueue.subscribe(msg => {
    webview.contentWindow!.postMessage(msg, "*")
  })

  sendToMain({ type: "Ready" })

  // setupControlPanel(store)
})
