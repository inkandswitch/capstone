process.hrtime = require("browser-process-hrtime")
import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
let racf = require("random-access-chrome-file")

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

const hm = new Hypermerge({ storage: racf })

chrome.runtime.onConnect.addListener(port => {
  const store = new StoreBackend(hm, msg => {
    port.postMessage(msg)
  })

  port.onMessage.addListener(msg => {
    hm.ready.then(() => {
      store.onMessage(msg)
    })
  })

  hm.ready.then(hm => {
    swarm(hm, {
      id: hm.core.archiver.changes.id,
      url: "wss://discovery-cloud.herokuapp.com",
      // url: "ws://localhost:8080",
    })
  })
})
