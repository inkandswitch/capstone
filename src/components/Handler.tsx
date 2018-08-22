import * as Preact from "preact"

interface Event {
  preventDefault?: Function
  stopPropagation?: Function
}

interface Props {
  children: JSX.Element
  [name: string]: any
}

export default abstract class Handler<
  InProps = {},
  State = {}
> extends Preact.Component<InProps & Props, State> {
  handlers: { [name: string]: (event: Event) => void } = {}

  get child(): JSX.Element {
    const { children } = this.props
    return Array.isArray(children) ? children[0] : null
  }

  filter(event: Event): Boolean {
    return true
  }

  stop = (event: Event) => {
    event.stopPropagation && event.stopPropagation()
    event.preventDefault && event.preventDefault()
  }

  handle = (name: string) => {
    return this.handlers[name] || (this.handlers[name] = this.handlerFor(name))
  }

  handlerFor(name: string) {
    return (event: Event) => {
      if (!this.props[name] || !this.filter(event)) return
      this.props[name](event)
    }
  }
}
