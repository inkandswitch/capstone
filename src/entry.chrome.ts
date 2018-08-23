// This should be a real typescript file but we're having trouble
// finding the AppWindow type which has a contentWindow on it.
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
