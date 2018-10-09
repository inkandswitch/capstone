process.env["DEBUG"] = "discovery-cloud:Client discovery-cloud:test protocol discovery-cloud:ClientPeer"

import DiscoveryCloudClient from "./Client"
import { Stream } from "stream"
import StoreBackend from "../../data/StoreBackend"
import * as Msg from "../../data/StoreMsg"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import { FrontendHandle } from "../../modules/hypermerge/frontend"
import { Doc, AnyEditDoc, EditDoc, AnyDoc } from "automerge/frontend"
import * as Debug from "debug"
const log = Debug("discovery-cloud:test")
let ram = require("random-access-memory")

const hm = new Hypermerge({ storage: ram })

interface Model {
  counter1?: number
  counter2?: number
}

type Handle = FrontendHandle | null

const buffers = keyPair()
const keys = {
  publicKey: Base58.encode(buffers.publicKey),
  secretKey: Base58.encode(buffers.secretKey),
}

const input = process.argv[2]

const docId = input || keys.publicKey

log("DOCID", docId)

hm.ready.then(hm => {
  swarm(hm, {
    id: hm.core.archiver.changes.id,
    //url: "wss://discovery-cloud.herokuapp.com",
    url: "ws://0.0.0.0:8080",
  })

  let handle = new FrontendHandle()
  handle.setActorId(docId)

  const store = new StoreBackend(hm, msg => {
    if (msg.type == "Patch") {
      handle.patch(msg.patch)
    } else {
      log("Uhandled message", msg)
    }
  })

  if (!input) store.onMessage({ type: "Create", docId, keys })
  store.onMessage({ type: "Open", docId })

  handle.on("requests", changes => {
    store.onMessage({ type: "ChangeRequest", docId, changes })
  })

  setInterval(() => {
    handle.change((doc: EditDoc<Model>) => {
      if (input) doc.counter1 = (doc.counter1 || 0) + 1
      else doc.counter2 = (doc.counter2 || 0) + 1
    })
    log("CHANGE", handle._front)
  }, 2000)
})
