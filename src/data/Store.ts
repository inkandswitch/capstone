import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaults, mapValues } from "lodash"
import StoreBackend from "./StoreBackend"

export default class Store {
  backend: StoreBackend

  constructor() {
    this.backend = new StoreBackend()
  }

  dontKeepThisCurrentId = 0

  create(): Promise<AnyDoc> {
    return this.backend.create()
  }

  open(id: string): Promise<AnyDoc> {
    return this.backend.open(id)
  }

  replace(doc: AnyDoc): AnyDoc {
    this.backend.replace(doc)
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
