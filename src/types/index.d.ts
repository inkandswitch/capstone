import Content from "../components/Content"

declare global {
  const LOCAL_IP: string

  interface Window {
    Content: typeof Content
    visualViewport: VisualViewport
    requestIdleCallback: (cb: () => void, options?: { timeout: number }) => void
  }

  interface VisualViewport extends EventTarget {
    width: number
    height: number
  }

  interface JSON {
    parse(text: Buffer, reviver?: (key: any, value: any) => any): any
  }

  type Point = { x: number; y: number }

  interface DataTransferItemList extends DataTransferItemList {
    // Fix for incorrect TS built-in type
    [Symbol.iterator](): IterableIterator<DataTransferItem>
  }
}
