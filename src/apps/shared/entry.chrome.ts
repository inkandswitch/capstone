const webview = document.getElementById("webview")! as HTMLIFrameElement
const DebugPane = document.getElementById("DebugPane")!
import Queue from "../../data/Queue"

const webviewQueue = new Queue<any>()

window.addEventListener("message", ({ data: msg }) => {
  if (typeof msg !== "object") return

  console.log(msg)

  if (msg.type === "ToggleDebug") {
    toggleDebug()
  }

  webviewQueue.push(msg)
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

  webviewQueue.subscribe(msg => {
    webview.contentWindow!.postMessage(msg, "*")
  })

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

// Receive messages from the Clipper chrome extension to import content
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (sender.id == "blocklistedExtension") return

    console.log("Received message from external extension", request, sender)

    webviewQueue.push({ type: "Clipper", ...request })

    sendResponse({ contentReceived: "success" })
  },
)
