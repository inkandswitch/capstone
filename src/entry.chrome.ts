process.hrtime = require("browser-process-hrtime")
import StoreComms from "./data/StoreComms"

let mainWindow: chrome.app.window.AppWindow

setTimeout(() => {
  chrome.app.runtime.onLaunched.addListener(() => {
    chrome.app.window.create(
      "index.html",
      {
        id: "main",
        frame: "chrome",
        state: "fullscreen",
        resizable: true,
        outerBounds: {
          // Half-screen default for development
          // Press "square" key (F3) to toggle
          top: 0,
          left: 0,
          width: screen.width / 2,
          height: screen.height,
        },
      },
      win => {
        mainWindow = win
        chrome.storage.local.get(["disableFullscreen"], result => {
          if (!result.disableFullscreen) {
            win.fullscreen()
          }
        })
        win.show(true) // Passing focused: true
      },
    )
  })
}, 1000)

let comms = new StoreComms()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
  comms.onMessage(request, sender, sendResponse),
)

comms.hypermerge.ready.then(() => {
  chrome.runtime.onConnect.addListener(port => comms.onConnect(port))
})
