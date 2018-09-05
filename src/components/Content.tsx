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
interface Widget extends Preact.Component<WidgetProps<any>, any> {}

export type WidgetClass<T> = {
  new (...k: any[]): Widget
  reify(doc: AnyDoc): T
}

export interface Message {
  from: string
  to?: string
  type: string
  body: any
}

export type MessageHandler = {
  receive(message: any): void
}

export type DocumentUpdateListener<T> = (doc: Doc<T>) => void

export type Mode = "fullscreen" | "embed" | "preview"

export interface Props {
  url: string
  mode: Mode
  isFocused?: boolean
  [k: string]: unknown
}

export abstract class DocumentActor<T> {
  url: string
  docId: string
  doc: Doc<T>

  static async receive(message: any) {}

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

  emit(message: any) {
    setTimeout(() => {
      Content.send({ ...message, from: this.url })
    }, 0)
  }

  abstract onMessage(message: any): void
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
    return doc.then(doc => Reify.reify(doc, widget.reify))
  }

  static change<T>(url: string, doc: Doc<T>, msg: string, cb: ChangeFn<T>) {
    const { id } = Link.parse(url)
    Content.store.change(id, doc, "", cb)
    //.then(doc => {
    //  const updateListener = Content.documentUpdateListeners[id]
    //  updateListener && updateListener(doc)
    //})
    // TODO: Temporary hack for optimistic updates.
    const updateListener = Content.documentUpdateListeners[id]
    updateListener && updateListener(doc)
  }

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

  static send(message: Message) {
    message.to = message.to || Content.getParent(message.from)
    if (!message.to) {
      return
    }
    const { type: recipientType } = Link.parse(message.to)
    const recipient = Content.getMessageHandler(recipientType)
    recipient.receive(message)
  }

  static setParent(childUrl: string, parentUrl: string) {
    Content.ancestorMap[childUrl] = parentUrl
  }

  static getParent(childUrl: string): string | undefined {
    return this.ancestorMap[childUrl]
  }

  static clearParent(childUrl: string) {
    delete this.ancestorMap[childUrl]
  }

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
