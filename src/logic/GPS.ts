import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import { pickBy } from "lodash"
import * as GPS from "../logic/GPS"

export type PointerSnapshot = { [pointerId: string]: PointerEvent }
export type Pointer = {
  pointerId: number
  pointerType: string
  history: PointerEvent[]
}

// Pointer stream
// ==============

// TODO: clean this up.
let events$ = new Rx.Observable<PointerSnapshot>()

// Connect a stream of PointerEvents to the GPS.
export function connectInput(input$: Rx.Observable<PointerEvent>) {
  events$ = input$.pipe(
    RxOps.scan((previousSnapshot: GPS.PointerSnapshot, event: PointerEvent) => {
      // Remove any pointers from the previous snapshot for which the most recent
      // event is pointerup or pointercancel.
      const snapshot = pickBy(
        previousSnapshot,
        e => e.type !== "pointerup" && e.type !== "pointercancel",
      )
      snapshot[event.pointerId] = event
      return snapshot
    }, {}),
  )
}

// Expose a stream of PointerSnapshots
export const stream = () => events$

// Snapshot Utils
// ==============

// Filter the snapshot so only touch pointers remain.
export const onlyTouch = (s: PointerSnapshot) =>
  pickBy(s, e => e.pointerType === "touch")

// Filter the snapshot so only pen pointers remain.
export const onlyPen = (s: PointerSnapshot) =>
  pickBy(s, e => e.pointerType === "pen" || e.shiftKey)

// True if there are pointers in the snapshot, False if empty.
export const ifNotEmpty = (s: PointerSnapshot) => Object.keys(s).length > 0

// Convert to a list of pointers.
export const toPointers = (s: PointerSnapshot) => Object.values(s)

// Get an arbitrary pointer from the snapshot.
export const toAnyPointer = (s: PointerSnapshot) => toPointers(s)[0]

// Filter the snapshot so only pointers on a target remain.
export const onlyOnTarget = (target: HTMLElement) => (
  snapshot: PointerSnapshot,
) => pickBy(snapshot, e => target.contains(e.target as Node))
