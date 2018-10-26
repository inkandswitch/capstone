import * as Debug from "debug"

export default class AsyncQueue<T> {
  private queue: T[] = []
  private subscription?: (item: T, done: () => void) => void
  private log: Debug.IDebugger
  private locked: boolean = false

  constructor(name: string = "unknown") {
    this.log = Debug(`queue:${name}`)
  }

  push(item: T) {
    this.log("queued", item)
    this.queue.push(item)
    if (!this.locked) this.shift()
  }

  subscribe(subscriber: (item: T, done: () => void) => void) {
    if (this.subscription) {
      throw new Error("only one subscriber at a time to a queue")
    }

    this.log("subscribe")

    this.subscription = subscriber

    if (!this.locked) this.shift()
  }

  unsubscribe() {
    this.log("unsubscribe")
    this.subscription = undefined
  }

  get length() {
    return this.queue.length
  }

  private shift = (): void => {
    this.locked = false
    if (this.queue.length > 0 && this.subscription) {
      let item = this.queue.shift()!
      this.log("shifted", item)
      this.locked = true
      this.subscription(item, this.shift)
    }
  }
}
