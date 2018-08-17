import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaults, mapValues } from "lodash"
import sample from "./sample"

export default class Store {
  docs: { [id: string]: AnyDoc } = mapValues(sample, (json, id) =>
    makeDoc(id, json),
  )

  listeners: { [id: string]: Array<(doc: AnyDoc) => void> | undefined } = {}

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
    this.emitChange(doc)
    return doc
  }

  change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>) {
    return this.replace(change(doc, msg, cb))
  }

  listenersFor(id: string): Array<(doc: AnyDoc) => void> {
    let listeners = this.listeners[id]
    if (!listeners) {
      this.listeners[id] = listeners = []
    }
    return listeners
  }

  emitChange(doc: AnyDoc): AnyDoc {
    this.listenersFor(doc._actorId).forEach(cb => {
      cb(doc)
    })
    return doc
  }

  subscribe(id: string, cb: (doc: AnyDoc) => void) {
    this.listenersFor(id).push(cb)
  }

  unsubscribe(id: string, cb: (doc: AnyDoc) => void) {
    const listeners = this.listenersFor(id)
    const idx = listeners.indexOf(cb)
    if (idx < 0) return
    listeners.splice(idx, 1)
  }
}

function makeDoc(id: string, json: object): AnyDoc {
  return change(init(id), "Init", doc => {
    defaults(doc, json)
  })
}
