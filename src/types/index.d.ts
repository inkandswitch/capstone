import Content from "../components/Content"
import * as StoreMsg from "../data/StoreMsg"

declare global {
  interface Window {
    Content: typeof Content
    visualViewport: VisualViewport
    requestIdleCallback: (cb: () => void, options?: { timeout: number }) => void
    sendToEntry: (msg: StoreMsg.MainToEntry) => void
  }

  interface PointerEvent {
    getCoalescedEvents: () => PointerEvent[]
  }

  interface VisualViewport extends EventTarget {
    width: number
    height: number
  }

  interface JSON {
    parse(text: Buffer, reviver?: (key: any, value: any) => any): any
  }

  type Point = { x: number; y: number }

  type Size = { width: number; height: number }

  interface DataTransferItemList extends DataTransferItemList {
    // Fix for incorrect TS built-in type
    [Symbol.iterator](): IterableIterator<DataTransferItem>
  }
}
