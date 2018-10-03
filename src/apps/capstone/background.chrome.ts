process.hrtime = require("browser-process-hrtime")

let mainWindow: chrome.app.window.AppWindow

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
