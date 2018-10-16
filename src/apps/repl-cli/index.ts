import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
import Content from "../../components/Content"
import Store from "../../data/Store"
import * as Peek from "../../data/Peek"
import * as Link from "../../data/Link"
const raf = require("random-access-file")

const DEBUG = false

const hm = new Hypermerge({ storage: raf })
const storeBackend = new StoreBackend(hm)
Content.store = new Store()

storeBackend.queue.subscribe(msg => {
  if (DEBUG) {
    console.log("backend msg", msg)
  }
  Content.store.onMessage(msg)
})

Content.store.queue.subscribe(msg => {
  if (DEBUG) {
    console.log("frontend msg", msg)
  }
  storeBackend.onMessage(msg)
})

hm.ready.then(hm => {
  storeBackend.sendToFrontend({ type: "Ready" })

  swarm(hm, {
    id: hm.core.archiver.changes.id,
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
  })

  if (DEBUG) {
    Peek.enable()
  }

  // TODO: argv
  const { id } = Link.parse(
    "capstone://Workspace/VG7Jzqd91cYEEsUYmSw14xnXYkdCxDys91fiH6Dosc5/B5x",
  )

  const handle = Content.store.handle(id)

  handle.on("doc", doc => {
    console.log("doc.commands", doc.commands)
  })

  // TODO: read + print + loop
  setTimeout(() => {
    console.log("=== eval ===")

    handle.change((doc: any) => {
      // doc.commands.push({ code: "2 + 2" })

      return doc
    })
  }, 4000)
})
