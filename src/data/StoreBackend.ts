import { AnyDoc } from "automerge"
import Hypermerge from "../hypermerge"
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
    return new Promise<AnyDoc>((resolve, reject) => {
      let resolved = false // HACK until we can emit changes
      const handle = this.hypermerge.openHandle(id)
      handle.onChange((doc: AnyDoc) => {
        if (!resolved) resolve(doc)
        resolved = true
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
