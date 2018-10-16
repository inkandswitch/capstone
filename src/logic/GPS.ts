import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import { pickBy, map, forEach } from "lodash"
import * as GPS from "../logic/GPS"

export enum InteractionMode {
  default,
  inking,
}

export type PointerSnapshot = { [pointerId: string]: Pointer }
export type Pointer = {
  canceled: boolean
  pointerId: number
  pointerType: string
  history: PointerEvent[]
}

// Pointer stream
// ==============

// TODO: clean this up.
let events$ = new Rx.Observable<PointerSnapshot>()
let interactionMode = InteractionMode.default

// Connect a stream of PointerEvents to the GPS.
export function connectInput(input$: Rx.Observable<PointerEvent>) {
  events$ = input$.pipe(
    RxOps.scan((previousSnapshot: GPS.PointerSnapshot, event: PointerEvent) => {
      const notCanceled = pickBy(previousSnapshot, p => {
        const mostRecent = p.history[p.history.length - 1]
        if (p.pointerType === "touch") {
          return !p.canceled && mostRecent.type !== "pointerup"
        } else {
          return (
            mostRecent.type !== "pointercancel" &&
            mostRecent.type !== "pointerup"
          )
        }
      })
      const snapshot = forEach(notCanceled, p => {
        const mostRecent = p.history[p.history.length - 1]
        p.canceled = mostRecent.type === "pointercancel"
      })

      const existingPointer = snapshot[event.pointerId]
      if (existingPointer) {
        existingPointer.history.push(event)
      } else {
        const pointer = {
          pointerId: event.pointerId,
          pointerType: event.pointerType,
          canceled: false,
          history: [event],
        }
        snapshot[event.pointerId] = pointer
      }
      return snapshot
    }, {}),
  )
}

export function setInteractionMode(mode: InteractionMode) {
  if (interactionMode == mode) return
  interactionMode = mode
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
  pickBy(
    s,
    e => e.pointerType === "pen" || e.history[e.history.length - 1].shiftKey,
  )

export const onlyActive = (s: PointerSnapshot) => pickBy(s, p => !p.canceled)

// True if there are pointers in the snapshot, False if empty.
export const ifNotEmpty = (s: PointerSnapshot) => Object.keys(s).length > 0

// Convert to a list of pointers.
export const toPointers = (s: PointerSnapshot) => Object.values(s)

// Get an arbitrary pointer from the snapshot.
export const toAnyPointer = (s: PointerSnapshot) => toPointers(s)[0]

export const toMostRecentEvent = (p: Pointer) => p.history[p.history.length - 1]

export const ifNotInking = (s: PointerSnapshot) =>
  interactionMode != InteractionMode.inking

// Filter the snapshot so only pointers on a target remain.
export const onlyOnTarget = (target: Node) => (snapshot: PointerSnapshot) =>
  pickBy(snapshot, e =>
    target.contains(e.history[e.history.length - 1].target as Node),
  )

export const onlyOffTarget = (target: Node) => (s: PointerSnapshot) =>
  pickBy(
    s,
    e => !target.contains(e.history[e.history.length - 1].target as Node),
  )
