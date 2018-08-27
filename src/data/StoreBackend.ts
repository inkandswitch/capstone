import { AnyDoc } from "automerge"
import Hypermerge from "../hypermerge"
let racf = require("random-access-chrome-file")

type StoreId = string

export default class Store {
  hypermerge: Hypermerge

  constructor() {
    this.hypermerge = new Hypermerge({ storage: racf })
  }

  create(): Promise<StoreId> {
    return this.hypermerge.ready.then(() => {
      let doc = this.hypermerge.create()
      let docId = this.hypermerge.getId(doc)
      return docId
    })
  }

  open(id: StoreId): Promise<any> {
    return this.hypermerge.ready.then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          let doc: AnyDoc = <AnyDoc>this.hypermerge.find(id)
          if (doc) {
            resolve(doc)
          } else {
            reject("cant find document id " + id)
          }
        }, 200)
      })
    })
  }

  replace(id: StoreId, doc: AnyDoc): AnyDoc {
    let oldDoc = this.hypermerge.find(id)
    return this.hypermerge.change(oldDoc, (oldDoc: any) => {
      for (let key in doc) {
        oldDoc[key] = doc[key]
      }
      return oldDoc
    })
  }
}
