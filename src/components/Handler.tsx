import * as React from "react"

interface Event {}

interface Props {
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
> extends React.Component<InProps & Props, State> {
  handlers: { [name: string]: (event: Event) => void } = {}

  // Override and return false for events that shouldn't be emitted.
  abstract filter(event: Event): Boolean

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
