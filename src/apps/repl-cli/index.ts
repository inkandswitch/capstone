const raf = require("random-access-file")
import * as Link from "../../data/Link"
import * as Peek from "../../data/Peek"
import CloudClient from "../../modules/discovery-cloud/Client"
import Content from "../../components/Content"
import Store from "../../data/Store"
import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import { parse } from "flatted"

const workspaceUrl = process.argv[2]

const DEBUG = false

const hm = new Hypermerge({ storage: raf })
const storeBackend = new StoreBackend(hm)
Content.store = new Store()

storeBackend.sendQueue.subscribe(msg => {
  if (DEBUG) {
    console.log("backend msg", msg)
  }
  Content.store.onMessage(msg)
})

Content.store.sendQueue.subscribe(msg => {
  if (DEBUG) {
    console.log("frontend msg", msg)
  }
  storeBackend.onMessage(msg)
})

hm.joinSwarm(
  new CloudClient({
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
    id: hm.id,
    stream: hm.stream,
  }),
)

hm.ready.then(hm => {
  storeBackend.sendToFrontend({ type: "Ready" })

  if (DEBUG) {
    Peek.enable()
  }

  const { id } = Link.parse(workspaceUrl)
  const handle = Content.store.handle(id)

  handle.on("doc", doc => {
    doc.commands.forEach(
      ({ code, result }: { code: string; result: string }) => {
        console.log(`$ ${code}`)

        const parsed = parse(result)

        if (parsed.error) {
          console.log(`ERR: ${parsed.error}`)
        } else {
          console.log(`> ${parsed.result}`)
        }
      },
    )
  })

  // TODO: read + print + loop
  setTimeout(() => {
    console.log("=== eval ===")

    handle.change((doc: any) => {
      // if (!doc.commands) {
      // doc.commands = []
      // }

      // doc.commands.push({ code: "3 + 2" })

      return doc
    })
  }, 4000)
})
