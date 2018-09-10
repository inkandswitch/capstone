import * as Preact from "preact"
import * as Link from "../data/Link"
import { AnyDoc, Doc, AnyEditDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Reify from "../data/Reify"
import { once } from "lodash"

export interface WidgetProps<T> {
  url: string
  mode: Mode
  store: Store
}
interface Widget<T> extends Preact.Component<WidgetProps<T>, any> {}

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

export type MessageHandler = {
  receive(message: FullyFormedMessage<any>): void
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
  url: string
  docId: string
  doc: Doc<T>
  change: (cb: (doc: Doc<T>) => Doc<T>) => void

  static receive(message: FullyFormedMessage<any>) {
    const onDocumentReady = (doc: Doc<any>) => {
      const { id } = Link.parse(message.to)
      const actor = new this(message.to, id, doc, changeFn)
      actor.onMessage(message)
    }
    // TODO: this will leave a noop receiveChangeCallback attached
    // to the port.
    const changeFn = Content.open(message.to, once(onDocumentReady))
  }

  constructor(url: string, docId: string, doc: Doc<T>, changeFn: Function) {
    this.url = url
    this.docId = docId
    this.doc = doc
    // Recreate previous change interface.
    this.change = (cb: (doc: Doc<T>) => Doc<T>) => changeFn(cb(this.doc))
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

export default class Content extends Preact.Component<Props & unknown> {
  static defaultProps = {
    isFocused: false,
  }

  static widgetRegistry: { [type: string]: WidgetClass<any> } = {}
  static messageHandlerRegistry: { [type: string]: MessageHandler } = {}
  static ancestorMap: { [child: string]: string } = {}
  static documentUpdateListeners: {
    [url: string]: DocumentUpdateListener<any>
  } = {}
  static documentCache: { [id: string]: Doc<any> } = {}

  static store: Store

  /// Registry:

  // Creates an initialized document of the given type and returns its URL
  static create(type: string): Promise<string> {
    return this.store.create().then(id => Link.format({ type, id }))
  }

  // Opens an initialized document at the given URL

  static open<T>(url: string, callback: Function): (newDoc: any) => void {
    const { type, id } = Link.parse(url)
    const widget = this.find(type) as WidgetClass<T>
    const replaceCallback = this.store.open(id, doc =>
      callback(Reify.reify(doc, widget.reify)),
    )
    return replaceCallback
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
    if (!handler) throw new Error(`Handler not found in registry: ${type}`)
    return handler
  }

  static send(message: Message & WithSender) {
    message.to = message.to || Content.getParent(message.from)
    if (!isFullyFormed(message)) {
      return
    }
    const { type: recipientType } = Link.parse(message.to)
    const recipient = Content.getMessageHandler(recipientType)
    recipient.receive(message)
  }

  // Component-ordered Document Hierarchy
  // ====================================
  static setParent(childUrl: string, parentUrl: string) {
    Content.ancestorMap[childUrl] = parentUrl
  }

  static getParent(childUrl: string): string | undefined {
    return this.ancestorMap[childUrl]
  }

  static clearParent(childUrl: string) {
    delete this.ancestorMap[childUrl]
  }

  // Component
  // =========

  get registry() {
    return Content.widgetRegistry
  }

  getChildContext() {
    return { parentUrl: this.props.url }
  }

  componentDidMount() {
    if (this.context.parentUrl) {
      Content.setParent(this.props.url, this.context.parentUrl)
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.url !== this.props.url) {
      Content.clearParent(this.props.url)
      if (this.context.parentUrl) {
        Content.setParent(nextProps.url, this.context.parentUrl)
      }
    }
  }

  componentWillUnmount() {
    if (this.context.parentUrl) {
      Content.clearParent(this.props.url)
    }
  }

  render() {
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

    return <Widget {...this.props} store={Content.store} />
  }
}

export class Missing extends Preact.Component<{ type: string }> {
  render() {
    return <div>'{this.props.type}' not found in Content.registry</div>
  }
}
