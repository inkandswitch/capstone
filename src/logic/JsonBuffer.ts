export function parse(buffer: ArrayBuffer | ArrayBufferView): any {
  const decoder = new TextDecoder()
  return JSON.parse(decoder.decode(buffer))
}

export function bufferify(value: any): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(JSON.stringify(value))
}
