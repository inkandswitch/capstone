import StoreBackend from "./data/StoreBackend"

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
      win.fullscreen()
      win.show(true) // Passing focused: true
    },
  )
})

class StoreComms {
  store: StoreBackend

  constructor(store: any) {
    this.store = store
  }

  onMessage = (request: any, sender: any, sendResponse: any) => {
    let { command, args = {} } = request
    let { id, doc } = args

    switch (command) {
      case "Create":
        this.store.create().then(id => sendResponse(id))
        break
      case "Open":
        this.store.open(id).then(doc => sendResponse(doc))
        break
      case "Replace":
        return this.store.replace(id, doc)
    }
    return true // indicate we will respond asynchronously
  }
}

let store = new StoreBackend()
let comms = new StoreComms(store)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
  comms.onMessage(request, sender, sendResponse),
)
