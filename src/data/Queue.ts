import * as Debug from "debug"

export default class Queue<T> {
  queue: T[] = []
  subscription?: (item: T, done: () => void) => void
  log: Debug.IDebugger
  locked: boolean = false
  push: (item: T) => void

  constructor(name: string = "unknown") {
    this.log = Debug(`queue:${name}`)
    this.push = this.enqueue
  }

  enqueue = (item: T) : void => {
    this.log("queued", item)
    this.queue.push(item)
  }

  subscribe(subscriber: (item: T) => void) {
    if (this.subscription) {
      throw new Error("only one subscriber at a time to a queue")
    }

    this.log("subscribe")

    while (this.queue.length > 0) {
      const item = this.queue.shift()
      subscriber(item!)
    }

    this.push = subscriber
  }

  subscribeSync(subscriber: (item: T, done: () => void) => void) {
    if (this.subscription) {
      throw new Error("only one subscriber at a time to a queue")
    }

    this.log("subscribeSync")

    this.subscription = subscriber

    this.push = this.pushSync

    this.shift()
  }

  private pushSync = (item: T) : void => {
    this.enqueue(item)
    if (!this.locked) this.shift()
  }

  private shift = () : void => {
    if (this.queue.length > 0 && this.subscription) {
      let item = this.queue.shift()
      this.log("shifted", item)
      this.locked = true
      this.subscription(item!, this.shift)
    } else {
      this.locked = false
    }
  }

  unsubscribe() {
    this.log("unsubscribe")
    this.subscription = undefined
    this.push = this.enqueue
  }
}
