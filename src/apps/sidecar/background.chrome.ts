const windowParams: chrome.app.CreateWindowOptions = {
  id: "main",
  frame: "chrome",
  resizable: true,
}

function showMainWindow(cb: ((window: chrome.app.AppWindow) => void)) {
  chrome.app.window.create("index.html", windowParams, win => {
    maybeFullscreen(win)
    cb(win)
  })
}

function maybeFullscreen(win: chrome.app.AppWindow) {
  chrome.storage.local.get(["disableFullscreen"], result => {
    if (!result.disableFullscreen) {
      win.fullscreen()
    }
  })
}

chrome.app.runtime.onLaunched.addListener(() =>
  showMainWindow((win: chrome.app.AppWindow) => {
    win.show(true) // Passing focused: true
  }),
)

// Receive messages from the Clipper chrome extension to import content
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log("Received message from external extension", request, sender)

    const forwardClipperMessage = (win: Window) => {
      win.postMessage({ type: "Clipper", ...request }, "*")
      sendResponse({ contentReceived: "success" })
    }

    const windows = chrome.app.window.getAll()
    if (windows.length > 0) {
      const win = windows[0].contentWindow // we only support a single app window
      forwardClipperMessage(win)
    } else {
      showMainWindow((win: chrome.app.AppWindow) => {
        // don't show the window if it isn't currently shown
        forwardClipperMessage(win.contentWindow)
      })
    }
  },
)
