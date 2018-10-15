import * as crypto from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import { Picomerge } from ".."
import { Patch, FrontendHandle } from "../frontend"
import CloudClient from "../../discovery-cloud/Client"

import * as Debug from "debug"
const log = Debug("picomerge:test")

const docId = process.argv[2]

const t = new Picomerge({ path: "data2" })
const client = new CloudClient({
  url: "wss://discovery-cloud.herokuapp.com",
  id: t.id,
  stream: t.stream,
})

t.joinSwarm(client)

//const keys = crypto.keyPair()
//const docId = Base58.encode(keys.publicKey)

interface Foo {
  foo: string
  bar: string
  counter1: number
  counter2: number
}

log("about to open", docId)
const front: FrontendHandle<Foo> = docId
  ? t.openDocumentFrontend(docId)
  : t.createDocumentFrontend(crypto.keyPair())

let i = 1
front.on("doc", doc => {
  log("DOC", doc)
})
/*
if (!docId) {
  front.change(doc => {
    doc.foo = "bar"
    doc.bar = "baz"
    doc.counter2 = 0
  })
}
*/
setInterval(() => {
  front.change(doc => {
    doc.counter2 = doc.counter2 + 1 || 0
  })
}, 1000)
