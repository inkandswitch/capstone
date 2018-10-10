import * as React from "react"
import * as Link from "../data/Link"
import { AnyDoc, Doc, AnyEditDoc, EditDoc, ChangeFn } from "automerge/frontend"
import Store from "../data/Store"
import * as Reify from "../data/Reify"
import { once } from "lodash"

export interface WidgetProps<T> {
  url: string
  mode: Mode
  store: Store
}
interface Widget<T> extends React.Component<WidgetProps<T>, any> {}

export type WidgetClass<T> = {
  new (...k: any[]): Widget<T>
  reify(doc: AnyDoc): T
}

export interface Message {
  from?: string
  to?: string
  type: string
  body?: any
}

export interface WithSender {
  from: string
}

export interface WithRecipient {
  to: string
}

export type FullyFormedMessage<T extends Message> = Readonly<
  T & WithSender & WithRecipient
>
export function isFullyFormed(
  message: Message,
): message is FullyFormedMessage<Message> {
  return message.to !== undefined && message.from !== undefined
}

export interface DocumentCreated extends Message {
  type: "DocumentCreated"
  body: string
}

export interface ReceiveDocuments extends Message {
  type: "ReceiveDocuments"
  body: { urls: string[] }
}

export type MessageHandlerClass = {
  new (...k: any[]): DocumentActor<any, any>
}

export type DocumentUpdateListener<T> = (doc: Doc<T>) => void

export type Mode = "fullscreen" | "embed" | "preview"

export interface Props {
  url: string
  mode: Mode
  type?: string
  isFocused?: boolean
  [k: string]: unknown
}

// Base class for actors which act on a document.
// TODO: would be better to have change, emit, etc. passed in via constructor.
export class DocumentActor<
  T,
  I extends FullyFormedMessage<any>,
  O extends Message = never
> {
  url!: string
  docId!: string
  doc!: Doc<T>
  change!: (cfn: ChangeFn<T>) => void //(Doc<T>) => void

  receive(message: I) {
    const onDocumentReady = (doc: Doc<T>) => {
      const { id } = Link.parse(message.to)
      this.url = message.to
      this.docId = id
      this.doc = doc
      this.onMessage(message)
    }
    // TODO: this will leave a noop receiveChangeCallback attached
    // to the port.
    this.change = Content.open<T>(message.to, once(onDocumentReady))
  }

  create(type: string) {
    return Content.create(type)
  }

  emit(message: O) {
    // Convenience for re-emitting events
    if (message.to === this.url) {
      delete message.to
    }
    message.from = this.url

    // XXX: Is using rIC always desired behavior?
    window.requestIdleCallback(() => {
      Content.send(message as O & WithSender)
    })
  }

  async onMessage(message: I): Promise<void> {
    throw new Error("Not implemented: onMessage")
  }
}

export default class Content extends React.Component<Props & unknown> {
  static defaultProps = {
    isFocused: false,
  }

  static widgetRegistry: { [type: string]: WidgetClass<any> } = {}
  static messageHandlerRegistry: { [type: string]: MessageHandlerClass } = {}
  static ancestorMap: { [child: string]: string } = {}
  static documentUpdateListeners: {
    [url: string]: DocumentUpdateListener<any>
  } = {}
  static documentCache: { [id: string]: Doc<any> } = {}

  static store: Store
  static workspaceUrl: string

  /// Registry:

  // Creates an initialized document of the given type and returns its URL
  static create<T>(type: string): Promise<string> {
    const widget = this.find(type) as WidgetClass<T>
    const setup: any = (doc: any) => {
      Reify.reify(doc, widget.reify)
    }
    let id = this.store.create(setup)
    return Promise.resolve(Link.format({ type, id }))
  }

  // Opens an initialized document at the given URL

  static open<T>(
    url: string,
    callback: (doc: Doc<T>) => void,
  ): (cfn: ChangeFn<T>) => void {
    const { type, id } = Link.parse(url)
    const handle = this.store.handle(id)
    setImmediate(() => {
      handle.on("doc", callback)
    })
    return handle.change
  }

  static once<T>(url: string, cfn: Function): void {
    const update = Content.open(url, doc => {})
    cfn(update)
  }

  static registerWidget(type: string, component: WidgetClass<any>) {
    this.widgetRegistry[type] = component
  }

  static registerMessageHandler(type: string, messageHandler: any) {
    this.messageHandlerRegistry[type] = messageHandler
  }

  static find(type: string): WidgetClass<any> {
    const widget = this.widgetRegistry[type]
    if (!widget) throw new Error(`Widget not found in registry: '${type}'`)

    return widget
  }

  static getMessageHandler(type: string) {
    const handler = this.messageHandlerRegistry[type]
    if (!handler) console.log(`Message handler not found in registry: ${type}`)
    return handler
  }

  static send(message: Message) {
    message.to = message.to || Content.workspaceUrl
    const { type: recipientType } = Link.parse(message.to)
    const Recipient = Content.getMessageHandler(recipientType)
    if (!Recipient) return
    const recipient = new Recipient()
    recipient.receive(message)
  }

  // Component
  // =========

  get registry() {
    return Content.widgetRegistry
  }

  render() {
    // HACK: sometimes docs emit before they have all of their values.
    // This prevents the app from crashing in that case.
    if (!this.props.url) return null

    const type = this.props.type || Link.parse(this.props.url).type
    let Widget
    try {
      Widget = Content.find(type)
    } catch {
      Widget = undefined
    }

    if (!Widget) {
      return <Missing type={type} />
    }

    return <Widget key={this.props.url} {...this.props} store={Content.store} />
  }
}

export class Missing extends React.Component<{ type: string }> {
  render() {
    return <div>'{this.props.type}' not found in Content.registry</div>
  }
}
