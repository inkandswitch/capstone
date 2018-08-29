import * as Base58 from "bs58"

export function create(): string {
  return Base58.encode(Buffer.from(crypto.getRandomValues(new Uint8Array(32))))
}
