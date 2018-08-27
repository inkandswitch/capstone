import StoreBackend from "./data/StoreBackend"
import StoreComms from "./data/StoreComms"

let commandWindow: chrome.app.window.AppWindow

chrome.app.runtime.onLaunched.addListener(() => {
  if (commandWindow && !commandWindow.contentWindow.closed) {
    commandWindow.focus()
  } else {
    chrome.app.window.create(
      "index.html",
      { id: "mainwin", innerBounds: { width: 800, height: 609, left: 0 } },
      win => {
        commandWindow = win
      },
    )
  }
})

let store = new StoreBackend()
let comms = new StoreComms(store)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
  comms.onMessage(request, sender, sendResponse),
)
