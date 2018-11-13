import { LocalStorage } from "node-localstorage"

interface Global {
  localStorage: LocalStorage
}

declare var global: Global

global.localStorage = new LocalStorage("./localstorage")

const raf = require("random-access-file")
import * as Link from "capstone/Link"
import * as Peek from "../../data/Peek"
import * as Workspace from "../../plugins/Workspace"
import * as repl from "repl"
import CloudClient from "discovery-cloud/Client"
import Content from "capstone/Content"
import Handle from "capstone/Handle"
import { Model as REPLModel } from "capstone/REPL"
import Store from "capstone/Store"
import StoreBackend from "capstone/StoreBackend"
import { Doc } from "automerge/frontend"
import { Hypermerge } from "hypermerge"
import { last } from "lodash"
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

const startRepl = (replUrl: string) => {
  repl.start({
    prompt: ">>> ",
    eval: (cmd: string, context: any, filename: string, callback: Function) => {
      if (!cmd || !cmd.length) {
        callback()
      }

      const handle = Content.open<REPLModel>(replUrl)

      handle.change(doc => {
        if (!doc.commands) {
          doc.commands = [{ code: cmd }]
        } else {
          doc.commands.push({ code: cmd })
        }

        return doc
      })

      handle.subscribe(doc => {
        const lastCmd = last(doc.commands)
        if (!lastCmd) return

        const { result } = lastCmd as { result: string }
        if (!result) return

        const parsed = parse(result)

        handle.close()

        callback(parsed.error, parsed.result)
      })
    },
  })
}

hm.ready.then(hm => {
  if (DEBUG) {
    Peek.enable()
  }

  Content.once<Workspace.Model>(workspaceUrl, workspace => {
    console.log(`Welcome to Capstone REPL! (${workspace.replUrl})`)

    setTimeout(() => startRepl(workspace.replUrl), 10)
  })
})
