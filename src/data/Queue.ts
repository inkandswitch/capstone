export default class Queue<T> {
  queue: T[] = []
  subscription?: (item: T) => void

  push(item: T) {
    if (this.subscription) {
      this.subscription(item)
    } else {
      this.queue.push(item)
    }
  }

  subscribe(subscriber: (item: T) => void) {
    if (this.subscription) {
      throw new Error("only one subscriber at a time to a queue")
    }

    this.subscription = subscriber
    this.queue.forEach(e => {
      subscriber(e)
    })
    this.queue = []
  }

  unsubscribe() {
    this.subscription = undefined
  }
}
