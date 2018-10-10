import * as React from "react"
import * as Rx from "rxjs"

class ProviderSingleton {
  events$: Rx.Observable<PointerEvent> | undefined
}

export const Provider = new ProviderSingleton()

export class InputHandler extends React.Component {
  componentDidMount() {
    Provider.events$ = Rx.merge(
      Rx.fromEvent<PointerEvent>(document, "pointerdown"),
      Rx.fromEvent<PointerEvent>(document, "pointermove"),
      Rx.fromEvent<PointerEvent>(document, "pointerup"),
    )
  }

  render() {
    return null
  }
}
