import * as Preact from "preact"
import * as Link from "../data/Link"
import { AnyDoc, Doc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Reify from "../data/Reify"

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

  static receive(message: FullyFormedMessage<any>) {
    const { id } = Link.parse(message.to)
    Content.getDoc(message.to).then(doc => {
      const actor = new this(message.to, id, doc)
      actor.onMessage(message)
    })
  }

  constructor(url: string, docId: string, doc: Doc<T>) {
    this.url = url
    this.docId = docId
    this.doc = doc
  }

  create(type: string) {
    return Content.create(type)
  }

  change(cb: ChangeFn<T>) {
    return Content.change<T>(this.url, this.doc, "", cb)
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
  static open<T>(url: string): Promise<Doc<T>> {
    const { type, id } = Link.parse(url)
    const widget = this.find(type) as WidgetClass<T>
    const doc = this.store.open(id)
    return doc.then(doc => {
      const reified = Reify.reify(doc, widget.reify)
      Content.setCache(url, reified)
      return reified
    })
  }

  static change<T>(url: string, doc: Doc<T>, msg: string, cb: ChangeFn<T>) {
    const { id } = Link.parse(url)
    Content.store.change(id, doc, "", cb).then(doc => {
      Content.setCache(url, doc)
      const updateListener = Content.documentUpdateListeners[id]
      updateListener && updateListener(doc)
    })
  }

  static getDoc<T>(url: string): Promise<Doc<T>> {
    let doc = Content.readCache<T>(url)
    if (doc) {
      return Promise.resolve(doc)
    } else {
      return Content.open(url)
    }
  }

  // Unbounded Document Caching
  // ===========================
  // XXX: Documents are currently mutated, so we don't need to
  // think to much about stale cache entries. That will change
  // once we have proper backend/frontend communication.
  static readCache<T>(url: string): Doc<T> | undefined {
    const { id } = Link.parse(url)
    const doc = Content.documentCache[id]
    return doc
  }

  static setCache<T>(url: string, doc: Doc<T>) {
    const { id } = Link.parse(url)
    Content.documentCache[id] = doc
  }

  static unsetCache(url: string) {
    const { id } = Link.parse(url)
    delete Content.documentCache[id]
  }

  // Document Update Listeners
  // ===========================
  static addDocumentUpdateListener(
    url: string,
    cb: DocumentUpdateListener<any>,
  ) {
    const { id } = Link.parse(url)
    Content.documentUpdateListeners[id] = cb
  }

  static removeDocumentUpdateListener(url: string) {
    const { id } = Link.parse(url)
    delete Content.documentUpdateListeners[id]
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

  // XXX: Potentially handle in componentDidUpdate instead
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
    const { type } = Link.parse(this.props.url)
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
