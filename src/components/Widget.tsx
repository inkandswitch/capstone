import * as Preact from "preact"
import { defaultsDeep } from "lodash"
import { change, Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import Content, { WidgetClass, View } from "./Content"

export { Doc, AnyDoc }

export interface Props {
  id: string
  view: View
}

export interface State<T> {
  doc?: Doc<T>
}

export function register<T extends WidgetClass>(Component: T) {
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

    if (props.id == null) {
      this.state = {
        doc: this.store && this.store.create(this.defaults()),
      }
    } else {
      const doc = this.store && this.store.open(props.id)
      this.state = {
        doc: doc && this.decode(doc),
      }
    }
  }

  abstract defaults(): T
  abstract show(
    doc: Doc<T>,
    props?: Preact.RenderableProps<Props>,
  ): Preact.ComponentChild

  get store(): Store | undefined {
    return window.store
  }

  get doc(): Doc<T> | undefined {
    return this.state.doc
  }

  get view(): string {
    return this.props.view
  }

  decode(doc: AnyDoc): Doc<T> {
    return change(doc as Doc<T>, doc => {
      defaultsDeep(doc, this.defaults())
    })
  }

  change(callback: ChangeFn<T>): void {
    if (this.doc && this.store) this.store.change(this.doc, "", callback)
  }

  render() {
    return this.doc ? this.show(this.doc) : this.loading()
  }

  loading() {
    return "Loading..."
  }
}
