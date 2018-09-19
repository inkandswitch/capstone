import * as Preact from "preact"
import { getRequests, Doc, AnyDoc, ChangeFn } from "automerge/frontend"
import Content, {
  WidgetProps,
  Message,
  Mode,
  MessageHandlerClass,
} from "./Content"

export interface Props<T, M = never> {
  doc: Doc<T>
  url: string
  mode: Mode
  emit: (message: M) => void
  change: (cb: ChangeFn<T>) => void
}

interface State<T> {
  doc?: Doc<T>
}

// TODO: This is necessary to avoid Typescript warning, must be a better way.
interface WrappedComponent<T, M = never>
  extends Preact.Component<Props<T, M>, any> {}
type WrappedComponentClass<T, M = never> = {
  new (...k: any[]): WrappedComponent<T, M>
}

export function create<T, M extends Message = never>(
  type: string,
  WrappedComponent: WrappedComponentClass<T, M>,
  reify: (doc: AnyDoc) => T,
  messageHandler?: MessageHandlerClass,
) {
  const WidgetClass = class extends Preact.Component<WidgetProps<T>, State<T>> {
    // TODO: update register fn to not need static reify.
    static reify = reify
    requestChanges: (ChangeFn: any) => void

    constructor(props: WidgetProps<T>, ctx: any) {
      super(props, ctx)
      this.requestChanges = Content.open<T>(props.url, (doc: any) => {
        console.log("WIDGET STATE", doc)
        this.setState({ doc })
      })
    }

    emit = (message: M) => {
      Content.send(
        Object.assign({ to: this.props.url }, message, {
          from: this.props.url,
        }),
      )
    }

    change = (cb: ChangeFn<T>) => {
      // Temporary change prop until all document updates are move to Updater/reducer
      if (!this.state.doc) {
        // TODO: handle this case better.
        throw new Error("Cannot call change before the document has loaded.")
      }

      this.requestChanges(cb)
    }

    render() {
      if (this.state.doc) {
        return (
          <WrappedComponent
            {...this.props}
            doc={this.state.doc}
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
