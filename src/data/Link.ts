import * as Base58 from "bs58"
import { crc16 } from "js-crc"

export const SCHEME = "capstone"

export type Url = string

export interface Link {
  readonly url: string
  readonly type: string
  readonly id: string
  readonly scheme: string
  readonly crc: string
  readonly nonCrc: string
}

export const format = ({ type, id }: Pick<Link, "id" | "type">): string => {
  const nonCrc = `${SCHEME}://${type}/${id}`
  return `${nonCrc}/${crcOf(nonCrc)}`
}

export const parse = (url: string): Link => {
  const { nonCrc, scheme, type, id, crc } = parts(url)

  if (!nonCrc) throw new Error(`This is not a URL: ${url}`)
  if (!type) throw new Error(`URL missing type in ${url}.`)
  if (!id) throw new Error(`URL missing id in ${url}.`)
  if (!crc) throw new Error(`URL missing CRC in ${url}.`)

  if (scheme !== SCHEME) {
    throw new Error(`Invalid url scheme: ${scheme} (expected ${SCHEME})`)
  }

  if (!isValidCrc({ nonCrc, crc })) {
    throw new Error(`Failed CRC check: ${nonCrc} should have been ${crc}`)
  }

  return { url, nonCrc, scheme, type, id, crc }
}

export const parts = (url: string): Partial<Link> => {
  const [, /* url */ nonCrc, scheme, type, id, crc]: Array<string | undefined> =
    url.match(/^((\w+):\/\/(.+)\/(\w+))\/(\w{1,4})$/) || []

  return { nonCrc, scheme, type, id, crc }
}

export const isValidCrc = ({
  nonCrc,
  crc,
}: Pick<Link, "crc" | "nonCrc">): boolean => {
  return crcOf(nonCrc) === crc
}

export const crcOf = (str: string): string => hexTo58(crc16(str))

export const hexTo58 = (str: string): string =>
  Base58.encode(Buffer.from(str, "hex"))
