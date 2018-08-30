import { AnyDoc } from "automerge"
import Hypermerge from "../modules/hypermerge"
let racf = require("random-access-chrome-file")

type StoreId = string

export default class StoreBackend {
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

  open(id: StoreId): Promise<AnyDoc> {
    return this.hypermerge.ready.then(() => {
      return new Promise<AnyDoc>((resolve, reject) => {
        setTimeout(() => {
          let doc = this.hypermerge.find(id)
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
