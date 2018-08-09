import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaultsDeep, mapValues } from "lodash"
import sample from "./sample"

export default class Store {
  docs: { [id: string]: AnyDoc } = mapValues(sample, (json, id) =>
    makeDoc(id, json),
  )

  create<T>(defs: T, msg: string = "Create"): Doc<T> {
    return this.change(<Doc<T>>init(), msg, doc => {
      defaultsDeep(doc, defs)
    })
  }

  open(id: string): AnyDoc | undefined {
    return this.docs[id]
  }

  update<T>(doc: Doc<T>): Doc<T> {
    this.docs[doc._actorId] = doc
    return doc
  }

  change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>) {
    return this.update(change(doc, msg, cb))
  }
}

function makeDoc(id: string, json: object): AnyDoc {
  return change(init(id), "Init", doc => {
    defaultsDeep(doc, json)
  })
}
