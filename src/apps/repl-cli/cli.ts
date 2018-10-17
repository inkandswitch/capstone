const raf = require("random-access-file")
import * as Link from "../../data/Link"
import * as Peek from "../../data/Peek"
import * as repl from "repl"
import CloudClient from "../../modules/discovery-cloud/Client"
import Content from "../../components/Content"
import Store from "../../data/Store"
import StoreBackend from "../../data/StoreBackend"
import { FrontendHandle } from "../../modules/hypermerge/frontend"
import { Hypermerge } from "../../modules/hypermerge"
import { last, once } from "lodash"
import { parse } from "json-fn"

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

const startRepl = (handle: FrontendHandle<any>) => {
  repl.start({
    prompt: ">>> ",
    eval: (cmd: string, context: any, filename: string, callback: Function) => {
      const singleCallback = once((err, res) => callback(err, res))

      if (!cmd || !cmd.length) {
        callback()
      }

      handle.change((doc: any) => {
        doc.commands.push({ code: cmd })
        return doc
      })

      setTimeout(() => {
        handle.on("doc", doc => {
          const lastCmd = last(doc.commands)
          if (!lastCmd) return

          const { result } = lastCmd as { result: string }
          if (!result) return

          const parsed = parse(result)

          singleCallback(parsed.error, parsed.result)
        })
      }, 1)
    },
  })
}

hm.ready.then(hm => {
  storeBackend.sendToFrontend({ type: "Ready" })

  if (DEBUG) {
    Peek.enable()
  }

  const { id } = Link.parse(workspaceUrl)
  const handle = Content.store.handle(id)

  handle.change((doc: any) => {
    // clean up previous commands - warning, this will clear up hooks as well
    doc.commands = []
    return doc
  })

  console.log(`Welcome to Capstone CLI [${id}]`)

  setTimeout(() => startRepl(handle), 10)
})

