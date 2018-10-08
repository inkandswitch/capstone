process.env["DEBUG"] = "*"

import DiscoveryCloudClient from "./Client"
import { Stream } from "stream"
import * as Debug from "debug"
import StoreBackend from "../../data/StoreBackend"
import * as Msg from "../../data/StoreMsg"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import { FrontendHandle } from "../../modules/hypermerge/frontend"
import { Doc, AnyEditDoc, EditDoc, AnyDoc } from "automerge/frontend"
let ram = require("random-access-memory")

const hm = new Hypermerge({ storage: ram })

interface Model {
  counter?: number
}

hm.ready.then(hm => {
  swarm(hm, {
    id: hm.core.archiver.changes.id,
    url: "wss://discovery-cloud.herokuapp.com",
  })

  const store = new StoreBackend(hm, msg => {
    console.log("msg to frontend", msg)
  })

  const buffers = keyPair()
  const keys = {
    publicKey: Base58.encode(buffers.publicKey),
    secretKey: Base58.encode(buffers.secretKey),
  }
  const docId = keys.publicKey
  store.onMessage({ type: "Create", docId, keys })

  console.log("Opening DocId:", docId)
  const handle = new FrontendHandle(docId)

  handle.on("requests", changes => {
    store.onMessage({ type: "ChangeRequest", docId, changes })
  })

  setInterval(() => {
    handle.change((doc: EditDoc<Model>) => {
      if (!doc.counter) doc.counter = 0
      doc.counter++
    })
  }, 2000)

  //  store.onMessage({ type: "Open", docId })

  //  port.onMessage.addListener(msg => {
  //    store.onMessage(msg)
  //  })
})
