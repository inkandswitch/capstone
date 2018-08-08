import * as Preact from "preact"
import { Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"

export { Doc, AnyDoc }

export interface Props {
  id: string
}

export interface State<T> {
  doc: Doc<T>
}

// The base component that most document-based components should inherit from
export default abstract class Base<T> extends Preact.Component<
  Props,
  State<T>
> {
  constructor(props: Props, ctx: any) {
    super()

    if (props.id == null) {
      this.state = {
        doc: this.store.create(this.defaults()),
      }
    }
  }

  abstract defaults(): T
  abstract show(doc: Doc<T>): Preact.ComponentChild

  get store(): Store {
    return this.context.store
  }

  get doc(): Doc<T> {
    return this.state.doc
  }

  change(callback: ChangeFn<T>): Doc<T> {
    callback(this.doc)
    return this.doc
  }

  render() {
    return this.doc ? this.show(this.doc) : this.loading()
  }

  loading() {
    return "Loading..."
  }
}
