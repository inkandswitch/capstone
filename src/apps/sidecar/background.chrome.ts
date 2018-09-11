process.hrtime = require("browser-process-hrtime")
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

const comms = new StoreComms()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
  comms.onMessage(request, sender, sendResponse),
)

chrome.runtime.onConnect.addListener(port => {
  comms.hypermerge.ready.then(() => {
    comms.onConnect(port)
  })
})
