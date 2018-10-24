import * as React from "react"
import { Doc, AnyDoc, ChangeFn } from "automerge/frontend"
import ErrorBoundary from "./ErrorBoundary"
import * as Env from "../data/Env"
import Content, {
  WidgetProps,
  Message,
  Mode,
  MessageHandlerClass,
} from "./Content"

import Handle from "../data/Handle"
import { once, last } from "lodash"
import { Model as BoardModel } from "./Board"
import * as Link from "../data/Link"

export interface Props<T = {}, M = never> {
  doc: Doc<T>
  url: string
  mode: Mode
  env: Env.Env
  emit: (message: M) => void
  change: (cb: ChangeFn<T>) => void
}

interface State<T> {
  doc?: Doc<T>
}

// TODO: This is necessary to avoid Typescript warning, must be a better way.
interface WrappedComponent<T, M = never>
  extends React.Component<Props<T, M>, any> {}
type WrappedComponentClass<T, M = never> = {
  new (...k: any[]): WrappedComponent<T, M>
  reify?: (doc: AnyDoc) => T
  initDoc?: () => T
}

export interface AnyChange extends Message {
  type: "AnyChange"
  body: any
}

export function create<T, M extends Message = never>(
  type: string,
  WrappedComponent: WrappedComponentClass<T, M>,
  reify: (doc: AnyDoc) => T,
  messageHandler?: MessageHandlerClass,
) {
  const WidgetClass = class extends React.Component<WidgetProps<T>, State<T>> {
    // TODO: update register fn to not need static reify.
    static reify = reify
    static initDoc = WrappedComponent.initDoc
    handle?: Handle<T>

    constructor(props: WidgetProps<T>, ctx: any) {
      super(props, ctx)
      this.state = {}
    }

    componentDidMount() {
      this.handle = Content.open<T>(this.props.url, (doc: any) => {
        this.setState({ doc }, () => {
          if (Link.parse(this.props.url).type === "Bot") return

          // send AnyChange to bot(s) on current board
          Content.open(
            Content.workspaceUrl,
            once(workspace => {
              const boardUrl =
                workspace.navStack.length > 0
                  ? last(workspace.navStack)
                  : workspace.rootUrl

              Content.open(
                boardUrl,
                once((board: BoardModel) => {
                  Object.values(board.cards).forEach(card => {
                    if (
                      !card ||
                      (card && card.url && card.url.indexOf("Bot") < 0)
                    )
                      return

                    Content.send({
                      type: "AnyChange",
                      body: doc,
                      from: this.props.url,
                      to: card.url,
                    })
                  })
                }),
              )
            }),
          )
        })
      })
    }

    componentWillUnmount() {
      this.handle && this.handle.close()
    }

    emit = (message: M) => {
      Content.send(
        Object.assign({ to: this.props.url }, message, {
          from: this.props.url,
        }),
      )
    }

    change = (cb: ChangeFn<T>) => {
      this.handle && this.handle.change(cb)
    }

    render() {
      if (this.state.doc) {
        return (
          <ErrorBoundary>
            <WrappedComponent
              {...this.props}
              doc={this.state.doc}
              emit={this.emit}
              change={this.change}
            />
          </ErrorBoundary>
        )
      } else {
        return this.loading()
      }
    }

    loading() {
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
