import { AnyDoc } from "automerge"
import { defaults, mapValues } from "lodash"
import sample from "./sample"
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
      let docId = this.hypermerge.getId(doc);
      return docId;
    })
  }

  open(id: StoreId): Promise<AnyDoc> {
    return this.hypermerge.ready.then(() => {
      return new Promise((resolve,reject) => {
        setTimeout(() => {
          let doc = this.hypermerge.find(id);
          if (doc) {
            console.log("Open StoreId",id,doc)
            resolve(doc)
          } else {
            reject("cant find document id " + id)
          }
        },200)
      })
    })
  }

  replace(id: StoreId, doc: AnyDoc): AnyDoc {
    console.log("REPACE",id, doc);
    let oldDoc = this.hypermerge.find(id);
    return this.hypermerge.change(oldDoc, (oldDoc) => {
      for (let key in doc) {
        oldDoc[key] = doc[key];
      }
      return oldDoc;
    });
  }
}

