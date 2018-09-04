import { AnyDoc } from "automerge"
import Hypermerge from "../hypermerge"
let racf = require("random-access-chrome-file")

const Base58 = require("bs58")

function cleanid(id : StoreId) {
  if (id.length == 64) {
    return Base58.encode(Buffer.from(id,"hex"));
  }
  if (id.length == 44) {
    return id;
  }
  throw new Error("Invalid StoreId: "+id)
}

type StoreId = string

export default class StoreBackend {
  hypermerge: Hypermerge

  constructor() {
    this.hypermerge = new Hypermerge({ storage: racf })
    this.hypermerge.ready.then(() => {
      this.hypermerge.joinSwarm()

      let id = "1b51aea6bd8ff16a97de23af2c1b166172fba4a0f35321fc330533780120fda5";
      console.log("test-opening",id)
      let handle = this.hypermerge.openHandle(cleanid(id));
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
        const handle = this.hypermerge.openHandle(cleanid(id))
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
