import { AnyDoc } from "automerge"
import Hypermerge from "../hypermerge"
let racf = require("random-access-chrome-file")

const Base58 = require("bs58")

type StoreId = string

export default class StoreBackend {
  hypermerge: Hypermerge

  constructor() {
    this.hypermerge = new Hypermerge({ storage: racf })
    this.hypermerge.ready.then(() => {
      this.hypermerge.joinSwarm({ chrome: true })

      let id = "7924cc8cd14a643a3fc07e1b1e973032313a455871433268264de0672ee57213";
      console.log("test-opening",id)
      let handle = this.hypermerge.openHandle(id);
      handle.onChange((doc: AnyDoc) => {
        console.log("handle.onChange()",doc);
      })
    })
  }

  create(): Promise<StoreId> {
    return this.hypermerge.ready.then(() => {
      let doc = this.hypermerge.create()
      let docId = this.hypermerge.getId(doc)
      console.log({ docId, doc })
      return docId
    })
  }

  open(id: StoreId): Promise<AnyDoc> {
    return new Promise<AnyDoc>((resolve, reject) => {
      this.hypermerge.ready.then(() => {
        let resolved = false // HACK until we can emit changes
        console.log("opening",id)
        const handle = this.hypermerge.openHandle(id)
        handle.onChange((doc: AnyDoc) => {
          if (!resolved) resolve(doc)
          resolved = true
        })
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
