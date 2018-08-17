import { Doc, AnyDoc, ChangeFn } from "automerge"
import StoreProxy from "./StoreProxy"

export default class Store {
  proxy: StoreProxy

  constructor() {
    this.proxy = new StoreProxy()
  }

  create(): Promise<string> {
    return this.proxy.create()
  }

  open(id: string): Promise<AnyDoc> {
    return this.proxy.open(id)
  }

  replace(id: string, doc: AnyDoc): AnyDoc {
    this.proxy.replace(id, doc)
    return doc
  }

  change<T>(id: string, doc: Doc<T>, msg: string, cb: ChangeFn<T>): Promise<Doc<T>> {
    return new Promise(
      (resolve, reject) =>
        doc
          ? resolve(this.replace(id, cb(doc)) as Doc<T>)
          : reject(new Error("replace failed")),
    )
  }
}
