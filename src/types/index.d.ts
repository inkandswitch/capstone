import Content from "../components/Content"

declare global {
  function require(path: string): any
  interface Window {
    Content: typeof Content
  }

  const Buffer: BufferConstructor

  type Encoding =
    | "ascii"
    | "utf8"
    | "utf16le"
    | "ucs2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex"

  interface Buffer {
    toString(encoding?: Encoding): string
  }

  interface BufferConstructor {
    prototype: Buffer

    isBuffer(obj: Buffer): true
    isBuffer(obj: any): false

    from(str: string, type?: string): Buffer
  }
}
