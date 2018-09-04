import * as Preact from "preact"
import { Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Link from "../data/Link"
import Content, { WidgetClass, Mode } from "./Content"
import * as Pubsub from "../messaging/pubsub"
import * as DirectMessage from "../messaging/direct"

export { Doc, AnyDoc }

export interface Props {
  url: string
  mode: Mode
  isFocused: boolean
  dispatch?: (message: any) => void
}

export interface State<T> {
  doc?: Doc<T>
}

export function register<T extends WidgetClass<T>>(Component: T) {
  Content.register(Component.name, Component)
  return Component
}

// The base component that most document-based components should inherit from
export default abstract class Widget<T, P = {}> extends Preact.Component<
  Partial<P> & Props,
  State<T>
> {
  constructor(props: Partial<P> & Props, ctx: any) {
    super(props, ctx)
    Content.open<T>(props.url).then(doc => this.setState({ doc }))
  }

  abstract show(doc: Doc<T>): Preact.ComponentChild

  onMessage?: DirectMessage.MessageHandler

  get store(): Store {
    return Content.store
  }

  get doc(): Doc<T> | undefined {
    return this.state.doc
  }

  get mode(): Mode {
    return this.props.mode
  }

  broadcast(message: any): void {
    Content.broadcast(this.props.url, message)
  }

  subscribe(
    url: string,
    messageHandler: (url: string, message: any) => void,
  ): Pubsub.Unsubscribe {
    return Content.subscribe(url, messageHandler)
  }

  sendMessage(toUrl: string, message: any): void {
    Content.sendMessage(toUrl, message)
  }

  change(callback: ChangeFn<T>): void {
    if (!this.doc) {
      // TODO: handle this case better.
      throw new Error("Cannot call change before the document has loaded.")
    }

    const { id } = Link.parse(this.props.url)
    this.store
      .change(id, this.doc, "", callback)
      .then(doc => this.setState({ doc }))
  }

  render() {
    return this.doc ? this.show(this.doc) : this.loading()
  }

  loading(): Preact.ComponentChild {
    return "Loading..."
  }
}
