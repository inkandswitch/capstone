import * as React from "react"

interface Event {
  preventDefault: () => void
  stopPropagation: () => void
}

interface Props {
  [name: string]: any
}

export default class Handler<InProps = {}, State = {}> extends React.Component<
  InProps & Props,
  State
> {
  handlers: { [name: string]: (event: Event) => void } = {}

  get child(): React.ReactElement<any> {
    return React.Children.only(this.props.children)
  }

  filter(event: Event): Boolean {
    return true
  }

  stop = (event: Event) => {
    event.stopPropagation()
    event.preventDefault()
  }

  handle = (name: string) => {
    return this.handlers[name] || (this.handlers[name] = this.handlerFor(name))
  }

  handlerFor(name: string) {
    return (event: Event) => {
      if (!this.props[name] || !this.filter(event)) return
      this.stop(event)
      this.props[name](event)
    }
  }
}
