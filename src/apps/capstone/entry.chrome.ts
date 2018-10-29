import Queue from "../../data/Queue"
import * as Msg from "../../data/StoreMsg"

const webview = document.getElementById("webview")! as HTMLIFrameElement

const mainQueue = new Queue<Msg.EntryToMain>("EntryToMain")

function sendToMain(msg: Msg.EntryToMain) {
  mainQueue.push(msg)
}

window.addEventListener("message", event => {
  if (typeof event !== "object") return
  const msg: Msg.ToEntry = event.data
  switch (msg.type) {
    case "Clipper":
      sendToMain(msg)
      break
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
})
