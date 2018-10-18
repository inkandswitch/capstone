const webview = document.getElementById("webview")! as HTMLIFrameElement
const DebugPane = document.getElementById("DebugPane")!
import Queue from "../../data/Queue"
import * as Msg from "../../data/StoreMsg"

const mainQueue = new Queue<Msg.EntryToMain>()

function sendToMain(msg: Msg.EntryToMain) {
  mainQueue.push(msg)
}

window.addEventListener("message", event => {
  if (typeof event !== "object") return
  const msg: Msg.ToEntry = event.data

  switch (msg.type) {
    case "ToggleDebug":
      toggleDebug()
      break

    case "Clipper":
      sendToMain(msg)
      break
  }
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    toggleDebug()
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

  setDebugPannel()
})

function setDebugPannel() {
  chrome.storage.local.get("debugPannel", data => {
    DebugPane.style.display = data.debugPannel
  })
  DebugPane.style.display =
    DebugPane.style.display === "block" ? "none" : "block"
}

function toggleDebug() {
  console.log("Toggling debug pane")
  const mode = DebugPane.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ debugPannel: mode })
  setDebugPannel()
}
