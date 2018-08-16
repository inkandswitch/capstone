import { change, init, Doc, AnyDoc, ChangeFn } from "automerge"
import { defaults, mapValues } from "lodash"
import sample from "./sample"

export default class Store {
  docs: { [id: string]: AnyDoc } = mapValues(sample, (json, id) =>
    makeDoc(id, json),
  )

  create(): AnyDoc {
    return this.replace(init())
  }

  open(id: string): AnyDoc | undefined {
    return this.docs[id]
  }

  replace(doc: AnyDoc): AnyDoc {
    this.docs[doc._actorId] = doc
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

function makeDoc(id: string, json: object): AnyDoc {
  return change(init(id), "Init", doc => {
    defaults(doc, json)
  })
}
