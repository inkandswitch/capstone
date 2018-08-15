import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaults, mapValues } from "lodash"
import sample from "./sample"

export default class Store {
  docs: { [id: string]: AnyDoc } = mapValues(sample, (json, id) =>
    makeDoc(id, json),
  )

  create<T>(reify: (doc: AnyDoc) => T, msg: string = "Create"): Doc<T> {
    return this.reify(init(), msg, reify)
  }

  open(id: string): AnyDoc | undefined {
    return this.docs[id]
  }

  reify<T>(doc: AnyDoc, msg: string, reifyFn: (doc: AnyDoc) => T): Doc<T> {
    return this.replace(<Doc<T>>change(doc, msg, doc => {
      defaults(doc, reifyFn(doc))
    }))
  }

  replace<T>(doc: Doc<T>): Doc<T> {
    this.docs[doc._actorId] = doc
    return doc
  }

  change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>) {
    return this.replace(change(doc, msg, cb))
  }
}

function makeDoc(id: string, json: object): AnyDoc {
  return change(init(id), "Init", doc => {
    defaults(doc, json)
  })
}
