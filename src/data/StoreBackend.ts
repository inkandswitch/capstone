import { AnyDoc } from "automerge"
import { defaults, mapValues } from "lodash"
let racf = require("random-access-chrome-file")
import Hypermerge from "../hypermerge"

type StoreId = string

export default class Store {
  docs: {
    [id: string]: any
  } = {} /*mapValues(sample, (json: any, id: string) =>
    makeDoc(id, json),
  )*/

  hypermerge = new Hypermerge({
    storage: racf,
    port: 0,
  })

  dontKeepThisCurrentId = 0

  create(): Promise<StoreId> {
    return new Promise(resolve => {
      const storeId = "storeId" + this.dontKeepThisCurrentId++
      this.replace(storeId, {})
      resolve(storeId)
    })
  }

  open(id: StoreId): Promise<AnyDoc> {
    return new Promise((resolve, reject) => {
      var doc = this.hypermerge.openHandle(id)
      this.docs[id] = doc
      resolve(this.docs[id].get().contents)
      // reject(new Error("no such doc to open: " + id)),
    })
  }

  replace(id: StoreId, newDoc: AnyDoc) {
    this.docs[id].change((doc: any) => {
      doc.contents = { ...newDoc }
    })
  }
}

function init(): AnyDoc {
  return { contents: {} } as AnyDoc
}

function makeDoc(id: StoreId, json: object): AnyDoc {
  let empty = init()
  return defaults(empty, json)
}
