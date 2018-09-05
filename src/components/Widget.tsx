import * as Preact from "preact"
import { Doc, AnyDoc, ChangeFn } from "automerge"
import Store from "../data/Store"
import * as Link from "../data/Link"
import Content, { WidgetProps as Props, MessageHandler, Mode } from "./Content"

export { Doc, AnyDoc }

interface State<T> {
  doc?: Doc<T>
}

export interface WidgetProps<T> {
  doc: Doc<T>
  url: string
  mode: Mode
  emit: (message: any) => void
  change: (cb: ChangeFn<T>) => Doc<T>
}

// TODO: This is necessary to avoid Typescript warning, must be a better way.
interface WrappedComponent extends Preact.Component<any, any> {}
type WrappedComponentClass = {
  new (...k: any[]): WrappedComponent
}

export default function createWidget<T>(
  type: string,
  WrappedComponent: WrappedComponentClass,
  reify: (doc: AnyDoc) => T,
  messageHandler?: MessageHandler,
) {
  const WidgetClass = class extends Preact.Component<Props<T>, State<T>> {
    // TODO: update register fn to not need static reify.
    static reify = reify

    constructor(props: Props<T>, ctx: any) {
      super(props, ctx)
      Content.open<T>(props.url).then(doc => {
        Content.setCache<T>(props.url, doc)
        this.setState({ doc })
      })
    }

    componentDidMount() {
      Content.addDocumentUpdateListener(this.props.url, (doc: Doc<T>) => {
        this.setState({ doc })
      })
    }

    componentWillUnmount() {
      Content.removeDocumentUpdateListener(this.props.url)
      Content.unsetCache(this.props.url)
    }

    emit = (message: any) => {
      Content.send({
        to: this.props.url,
        ...message,
        from: this.props.url,
      })
    }

    change = (cb: ChangeFn<T>) => {
      // Temporary change prop until all document updates are move to Updater/reducer
      if (!this.state.doc) {
        // TODO: handle this case better.
        throw new Error("Cannot call change before the document has loaded.")
      }

      Content.change(this.props.url, this.state.doc, "", cb)
    }

    render() {
      if (this.state.doc) {
        return (
          <WrappedComponent
            {...this.props}
            {...this.state}
            emit={this.emit}
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
  Content.registerWidget(type, WidgetClass)
  if (messageHandler) {
    Content.registerMessageHandler(type, messageHandler)
  }

  return WidgetClass
}
