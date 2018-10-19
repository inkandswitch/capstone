import * as Debug from "debug"

export default class Queue<T> {
  queue: T[] = []
  subscription?: (item: T) => void
  log: Debug.IDebugger

  constructor(name: string = "unknown") {
    this.log = Debug(`queue:${name}`)
  }

  push(item: T) {
    if (this.subscription) {
      this.log("subbed", item)
      this.subscription(item)
    } else {
      this.log("queued", item)
      this.queue.push(item)
    }
  }

  subscribe(subscriber: (item: T) => void) {
    if (this.subscription) {
      throw new Error("only one subscriber at a time to a queue")
    }

    this.log("subscribe")

    this.subscription = subscriber
    this.queue.forEach(e => {
      subscriber(e)
    })
    this.queue = []
  }

  unsubscribe() {
    this.log("unsubscribe")
    this.subscription = undefined
  }
}
