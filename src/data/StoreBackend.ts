import { AnyDoc } from "automerge"
import { defaults, mapValues } from "lodash"
import sample from "./sample"

type StoreId = string

export default class Store {
  docs: { [id: string]: AnyDoc } = mapValues(sample, (json, id) =>
    makeDoc(id, json),
  )

  dontKeepThisCurrentId = 0

  create(): Promise<StoreId> {
    return new Promise(resolve => {
      const storeId = "storeId" + this.dontKeepThisCurrentId++
      this.replace(storeId, {})
      resolve(storeId)
    })
  }

  open(id: StoreId): Promise<AnyDoc> {
    return new Promise(
      (resolve, reject) =>
        this.docs[id]
          ? resolve(this.docs[id])
          : reject(new Error("no such doc to open: " + id)),
    )
  }

  replace(id: StoreId, doc: AnyDoc): AnyDoc {
    this.docs[id] = doc
    return doc
  }
}

function init(): AnyDoc {
  return {} as AnyDoc
}

function makeDoc(id: StoreId, json: object): AnyDoc {
  let empty = init()
  return defaults(empty, json)
}
