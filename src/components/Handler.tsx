import * as Preact from "preact"

interface Event {}

interface Props {
  children: JSX.Element
  [name: string]: any
}

// A component for building event handler components.
// It can be tricky/annoying to manage event handlers such that the
// callbacks don't change on every render. Handler manages the
// tricky part so you can focus on the logic.
// See ./Gesture.tsx for an example.
export default abstract class Handler<
  InProps = {},
  State = {}
> extends Preact.Component<InProps & Props, State> {
  handlers: { [name: string]: (event: Event) => void } = {}

  // Easy way to get a sole child component
  get child(): JSX.Element {
    const { children } = this.props
    return Array.isArray(children) ? children[0] : null
  }

  // Override and return false for events that shouldn't be emitted.
  filter(event: Event): Boolean {
    return true
  }

  handle = (name: string & keyof InProps) => {
    return this.handlers[name] || (this.handlers[name] = this.handlerFor(name))
  }

  handlerFor(name: string) {
    return (event: Event) => {
      if (!this.props[name] || !this.filter(event)) return
      this.props[name](event)
    }
  }
}
