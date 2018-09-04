export type MessageHandler = (message: any, topic: string) => any
export interface Subscription {
  id: number
  handler: MessageHandler
}
export type Unsubscribe = () => void
export interface Message {
  type: string
  [k: string]: any
}

let subscriptionId = 0
const subscriptions: { [topic: string]: Subscription[] } = {}

export function publish(topic: string, message: Message): void {
  const topicSubscriptions = subscriptions[topic]
  if (!topicSubscriptions) return
  topicSubscriptions.forEach(subscription => {
    subscription.handler(message, topic)
  })
}

export function subscribe(topic: string, handler: MessageHandler): Unsubscribe {
  const subscription = { id: subscriptionId++, handler: handler }
  if (subscriptions[topic]) {
    subscriptions[topic].push(subscription)
  } else {
    subscriptions[topic] = [subscription]
  }
  return () => unsubscribe(topic, subscription.id)
}

function unsubscribe(topic: string, subscriptionId: number) {
  const topicSubscriptions = subscriptions[topic]
  if (!topicSubscriptions || topicSubscriptions.length === 0) return
  subscriptions[topic] = topicSubscriptions.filter(
    sub => sub.id !== subscriptionId,
  )
}
