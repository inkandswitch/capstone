import * as Link from "../data/Link"

export interface Message {
  type: string
  [k: string]: any
}
export type MessageHandler = (message: Message, recipientUrl: string) => any

const recipients: { [type: string]: MessageHandler } = {}

export function registerRecipientType(
  recipientType: string,
  messageHandler: MessageHandler,
): void {
  if (recipients[recipientType]) {
    throw new Error(
      `Cannot register multiple messaging handlers for type: ${recipientType}.`,
    )
  }
  recipients[recipientType] = messageHandler
}

export function sendMessage(recipientUrl: string, message: any): void {
  // TODO: Remove this dependency on Link
  const { type } = Link.parse(recipientUrl)
  if (!recipients[type]) {
    throw new Error(`No known handler for recipient type: ${type}`)
  }
  recipients[type](message, recipientUrl)
}
