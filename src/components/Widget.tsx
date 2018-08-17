import * as Preact from "preact"
import { Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Link from "../data/Link"
import Content, { WidgetClass, Mode } from "./Content"

export { Doc, AnyDoc }

export interface Props {
  url: string
  mode: Mode
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

    const doc = Content.open<T>(props.url).then(doc => this.setState({ doc }))
  }

  abstract show(doc: Doc<T>): Preact.ComponentChild

  get store(): Store {
    return Content.store
  }

  get doc(): Doc<T> | undefined {
    return this.state.doc
  }

  get mode(): Mode {
    return this.props.mode
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
