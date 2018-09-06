import * as Preact from "preact"
import { Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Link from "../data/Link"
import Content, { WidgetClass, Mode } from "./Content"

interface WidgetProps {
  url: string
  mode: Mode
  store: Store
}

interface State<T> {
  doc?: Doc<T>
}

export interface Props<T> {
  doc: Doc<T>
  url: string
  mode: Mode
  change: (cb: ChangeFn<T>) => void
}

// TODO: This is necessary to avoid Typescript warning, must be a better way.
interface WrappedComponent<T> extends Preact.Component<Props<T>, any> {}
type WrappedComponentClass<T> = {
  new (...k: any[]): WrappedComponent<T>
}

function register(type: string, Component: WidgetClass<any>) {
  Content.register(type, Component)
  return Component
}

export function create<T>(
  type: string,
  WrappedComponent: WrappedComponentClass<T>,
  reify: (doc: AnyDoc) => T,
) {
  const WidgetClass = class extends Preact.Component<WidgetProps, State<T>> {
    // TODO: update register fn to not need static reify.
    static reify = reify

    constructor(props: WidgetProps, ctx: any) {
      super(props, ctx)
      Content.open<T>(props.url).then(doc => this.setState({ doc }))
    }

    change = (cb: ChangeFn<T>) => {
      // Temporary change prop until all document updates are move to Updater/reducer
      if (!this.state.doc) {
        // TODO: handle this case better.
        throw new Error("Cannot call change before the document has loaded.")
      }

      const { id } = Link.parse(this.props.url)
      this.props.store
        .change(id, this.state.doc, "", cb)
        .then(doc => this.setState({ doc }))
    }

    render() {
      if (this.state.doc) {
        return (
          <WrappedComponent
            {...this.props}
            doc={this.state.doc}
            change={this.change}
          />
        )
      } else {
        return this.loading()
      }
    }

    loading(): Preact.ComponentChild {
      return "Loading..."
    }
  }

  // Register the widget with the Content registry.
  // XXX: Should we do this here?
  register(type, WidgetClass)

  return WidgetClass
}
