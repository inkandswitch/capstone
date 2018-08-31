import * as Preact from "preact"
import * as Link from "../data/Link"
import { AnyDoc, Doc, AnyEditDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Reify from "../data/Reify"

interface Widget extends Preact.Component<{ url: string; mode: Mode }, any> {}

export type WidgetClass<T> = {
  new (...k: any[]): Widget
  reify(doc: AnyDoc): T
}

export type Mode = "fullscreen" | "embed" | "preview"

export interface Props {
  url: string
  mode: Mode
  type?: string
  isFocused?: boolean
  [k: string]: unknown
}

export default class Content extends Preact.Component<Props & unknown> {
  static defaultProps = {
    isFocused: false,
  }

  static registry: { [type: string]: WidgetClass<any> } = {}

  static store: Store

  /// Registry:

  // Creates an initialized document of the given type and returns its URL
  static create(type: string): Promise<string> {
    return this.store.create().then(id => Link.format({ type, id }))
  }

  // Opens an initialized document at the given URL
  static async open<T>(url: string): Promise<Doc<T>> {
    const { type, id } = Link.parse(url)
    const widget = this.find(type) as WidgetClass<T>
    const doc = await this.store.open(id)
    return Reify.reify(doc, widget.reify)
  }

  static async change(
    url: string,
    msg: string,
    cb: ChangeFn<{}>,
  ): Promise<AnyDoc> {
    const { type, id } = Link.parse(url)
    const doc = await this.store.open(id)
    return this.store.change(id, doc, msg, cb)
  }

  static register(type: string, component: WidgetClass<any>) {
    this.registry[type] = component
  }

  static find(type: string): WidgetClass<any> {
    const widget = this.registry[type]
    if (!widget) throw new Error(`Widget not found in registry: '${type}'`)

    return widget
  }

  get registry() {
    return Content.registry
  }

  render() {
    const { mode } = this.props
    const type = this.props.type || Link.parse(this.props.url).type
    const Widget = Content.find(type)

    if (!Widget) {
      return <Missing type={type} />
    }

    return <Widget {...this.props} />
  }
}

export class Missing extends Preact.Component<{ type: string }> {
  render() {
    return <div>'{this.props.type}' not found in Content.registry</div>
  }
}
