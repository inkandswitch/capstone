import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaults, mapValues } from "lodash"
import StoreProxy from "./StoreProxy"

export default class Store {
  proxy: StoreProxy

  constructor() {
    this.proxy = new StoreProxy()
  }

  create(): Promise<AnyDoc> {
    return this.proxy.create()
  }

  open(id: string): Promise<AnyDoc> {
    return this.proxy.open(id)
  }

  replace(doc: AnyDoc): AnyDoc {
    this.proxy.replace(doc)
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
