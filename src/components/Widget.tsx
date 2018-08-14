import * as Preact from "preact"
import { defaultsDeep } from "lodash"
import { change, Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import Content, { WidgetClass, View } from "./Content"

export { Doc, AnyDoc }

export interface Props {
  url: string
  view: View
}

export interface State<T> {
  doc?: Doc<T>
}

export function register<T extends WidgetClass<T>>(Component: T) {
  Content.register(Component.name, Component)
  return Component
}

// The base component that most document-based components should inherit from
export default abstract class Widget<
  T,
  P extends Props = Props
> extends Preact.Component<P, State<T>> {
  constructor(props: Props, ctx: any) {
    super()

    const doc = Content.open<T>(props.url)
    this.state = { doc }
  }

  abstract show(doc: Doc<T>): Preact.ComponentChild

  get store(): Store {
    return Content.store
  }

  get doc(): Doc<T> | undefined {
    return this.state.doc
  }

  set doc(doc: Doc<T> | undefined) {
    this.setState({ doc })
  }

  get view(): string {
    return this.props.view
  }

  change(callback: ChangeFn<T>): void {
    if (!this.doc) {
      // TODO: handle this case better.
      throw new Error("Cannot call change before the document has loaded.")
    }

    this.doc = this.store.change(this.doc, "", callback)
  }

  render() {
    return this.doc ? this.show(this.doc) : this.loading()
  }

  loading(): Preact.ComponentChild {
    return "Loading..."
  }
}
