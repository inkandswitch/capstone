import * as React from "react"
import * as Rx from "rxjs"
import * as Hammer from "hammerjs"

import {
  FromEventTarget,
  JQueryStyleEventEmitter,
} from "rxjs/internal/observable/fromEvent"

class ProviderSingleton {
  events$: Rx.Observable<HammerInput>
}

export const Provider = new ProviderSingleton()

export class InputHandler extends React.Component {
  //   pointerEvents: Rx.Subscription
  componentDidMount() {
    const recognizers: RecognizerTuple[] = [[Hammer.Press], [Hammer.Pan]]
    const hammer = new Hammer.Manager(document.body, { recognizers })

    Provider.events$ = Rx.fromEvent(
      hammer as JQueryStyleEventEmitter,
      "press pan",
    )
    Provider.events$.subscribe(this.onPointerEvent)
    // this.pointerEvents = Rx.merge(
    //   Rx.fromEvent(document, "pointerdown"),
    //   Rx.fromEvent(document, "pointermove"),
    //   Rx.fromEvent(document, "pointerup"),
    // ).subscribe(this.onPointerEvent)
  }

  componentWillUnmount() {
    console.log("component will unmount")
    // this.pointerEvents.unsubscribe()
  }

  render() {
    return null
  }

  onPointerEvent = (e: HammerInput) => {
    console.log(`getting ${e.type}`)
  }
}
