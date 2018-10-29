import HyperHandle from "hypermerge/handle"
import { ChangeFn, Doc } from "automerge/frontend"

interface Options {
  url: string
  id: string
  type: string
}

export default class Handle<T> {
  private hyper: HyperHandle<T>
  id: string
  url: string
  type: string

  constructor(hyper: HyperHandle<T>, { url, id, type }: Options) {
    this.hyper = hyper
    this.url = url
    this.id = id
    this.type = type
  }

  change = (fn: ChangeFn<T>): this => {
    this.hyper.change(fn)
    return this
  }

  subscribe = (subscriber: (doc: Doc<T>) => void): this => {
    this.hyper.subscribe(subscriber)
    return this
  }

  once = (subscriber: (doc: Doc<T>) => void): this => {
    this.hyper.once(subscriber)
    return this
  }

  close = (): this => {
    this.hyper.close()
    return this
  }
}
