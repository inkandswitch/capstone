import StoreBackend from "../../data/StoreBackend"
import StoreComms from "../../data/StoreComms"

chrome.app.runtime.onLaunched.addListener(() => {
  chrome.app.window.create(
    "index.html",
    {
      id: "main",
      frame: "chrome",
      resizable: true,
    },
    win => {
      win.show(true) // Passing focused: true
    },
  )
})

const store = new StoreBackend()
const comms = new StoreComms(store)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
  comms.onMessage(request, sender, sendResponse),
)
