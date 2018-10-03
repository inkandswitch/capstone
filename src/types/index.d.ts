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

  // type Encoding =
  //   | "ascii"
  //   | "utf8"
  //   | "utf16le"
  //   | "ucs2"
  //   | "base64"
  //   | "latin1"
  //   | "binary"
  //   | "hex"

  // interface Buffer {
  //   toString(encoding?: Encoding): string
  // }

  // interface BufferConstructor {
  //   prototype: Buffer

  //   isBuffer(obj: Buffer): true
  //   isBuffer(obj: any): false

  //   from(str: string, type?: string): Buffer
  // }

  interface JSON {
    parse(text: Buffer, reviver?: (key: any, value: any) => any): any
  }

  type Point = { x: number; y: number }

  interface DataTransferItemList extends DataTransferItemList {
    // Fix for incorrect TS built-in type
    [Symbol.iterator](): IterableIterator<DataTransferItem>
  }
}
