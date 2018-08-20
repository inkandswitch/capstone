import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaults, mapValues } from "lodash"
import sample from "./sample"

const Hypercore = require("hypercore")
var ram = require("random-access-memory")
const HyperDiscovery = require("hyperdiscovery")

var swarm = require("discovery-swarm")

var sw = swarm({ utp: false })

sw.listen(1000)
sw.join("quelle-disastre") // can be any id/name/hash

sw.on("connection", function(connection: any) {
  console.log("found + connected to peer")
})

export default class Store {
  docs: { [id: string]: AnyDoc } = mapValues(sample, (json, id) =>
    makeDoc(id, json),
  )

  core = new Hypercore(ram)

  dontKeepThisCurrentId = 0

  create(): Promise<AnyDoc> {
    return Promise.resolve(
      this.replace(init("storeId" + this.dontKeepThisCurrentId++)),
    )
  }

  open(id: string): Promise<AnyDoc> {
    return new Promise(
      (resolve, reject) =>
        this.docs[id]
          ? resolve(this.docs[id])
          : reject(new Error("no such doc to open")),
    )
  }

  replace(doc: AnyDoc): AnyDoc {
    this.docs[doc._actorId] = doc
    return doc
  }

  change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>): Promise<Doc<T>> {
    return new Promise(
      (resolve, reject) =>
        doc
          ? resolve(this.replace(change(doc, msg, cb)) as Doc<T>)
          : reject(new Error("replace failed")),
    )
  }
}

function makeDoc(id: string, json: object): AnyDoc {
  return change(init(id), "Init", doc => {
    defaults(doc, json)
  })
}
