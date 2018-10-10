import * as React from "react"
import * as Rx from "rxjs"

class ProviderSingleton {
  events$: Rx.Observable<PointerEvent> | undefined
}

export const Provider = new ProviderSingleton()

export class InputHandler extends React.Component {
  componentDidMount() {
    console.log("GPS did mount")
    Provider.events$ = Rx.merge(
      Rx.fromEvent<PointerEvent>(document.body, "pointerdown"),
      Rx.fromEvent<PointerEvent>(document.body, "pointermove"),
      Rx.fromEvent<PointerEvent>(document.body, "pointerup"),
      Rx.fromEvent<PointerEvent>(document.body, "pointercancel"),
    )
  }

  render() {
    return null
  }
}
