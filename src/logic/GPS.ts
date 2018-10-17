import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import { pickBy, map, forEach, mapValues } from "lodash"
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

export type PinchEvent = {
  distance: number
  eventType: "pinchin" | "pinchout" | "pinchend"
  pointerEvents: PointerEvent[]
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

// True if there are exactly two pointers in the snapshot, False if more or less than two
export const ifExactlyTwo = (s: PointerSnapshot) => Object.keys(s).length == 2

export const toMostRecentEvents = (s: PointerSnapshot) => mapValues(s, (value) => value.history[value.history.length - 1])

// True if there are exactly two pointers in the snapshot
// that have moved closer towards each other since the last snapshot
// export const ifTwoFingerPinch = (s: PointerSnapshot) => {
//   const activePointers = Object.values(s)
//   if (activePointers.length != 2) return false

//   const pointerA = activePointers[0]
//   const pointerB = activePointers[1]
//   if (pointerA.history.length < 2 || pointerB.history.length < 2) return false

//   return (
//     pointerA.history[pointerA.history.length - 1].type == "pointermove" ||
//     pointerB.history[pointerB.history.length - 1].type == "pointermove"
//   )
// }

// export const toPinchEvent = (s: PointerSnapshot): PinchEvent | undefined => {
//   const activePointers = Object.values(s)
//   if (activePointers.length != 2) return undefined

//   const pointerA = activePointers[0]
//   const pointerB = activePointers[1]
//   if (pointerA.history.length < 2 || pointerB.history.length < 2)
//     return undefined

//   const currentPointA = pointerA.history[pointerA.history.length - 1]
//   const currentPointB = pointerB.history[pointerB.history.length - 1]

//   const previousPointA = pointerA.history[pointerA.history.length - 2]
//   const previousPointB = pointerB.history[pointerB.history.length - 2]

  // const currentDistance = Math.sqrt(
  //   Math.pow(currentPointA.x - currentPointB.x, 2) +
  //     Math.pow(currentPointA.y - currentPointB.y, 2),
  // )

//   const previousDistance = Math.sqrt(
//     Math.pow(previousPointA.x - previousPointB.x, 2) +
//       Math.pow(previousPointA.y - previousPointB.y, 2),
//   )

//   if (currentPointA.type == "pointerup" || currentPointB.type == "pointerup") {
//     return {
//       distance: currentDistance,
//       eventType: "pinchend",
//       pointerEvents: [currentPointA, currentPointB],
//     }
//   } else {
//     if (currentDistance > previousDistance) {
//       return {
//         distance: currentDistance,
//         eventType: "pinchin",
//         pointerEvents: [currentPointA, currentPointB],
//       }
//     } else {
//       return {
//         distance: currentDistance,
//         eventType: "pinchout",
//         pointerEvents: [currentPointA, currentPointB],
//       }
//     }
//   }
// }

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
