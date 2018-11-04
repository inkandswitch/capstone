import * as Base58 from "bs58"
import { crc16 } from "js-crc"

export const SCHEME = "capstone"

export type Url = string

export interface Params {
  readonly height?: number
  readonly width?: number
}

export interface Link {
  readonly url: string
  readonly type: string
  readonly id: string
  readonly scheme: string
  readonly crc: string
  readonly nonCrc: string
  readonly params: Params
}

export interface LinkArgs extends Pick<Link, "id" | "type"> {
  readonly params?: Params
}

export const format = ({ type, id, params }: LinkArgs): string => {
  const nonCrc = `${SCHEME}://${type}/${id}`
  return `${nonCrc}/${crcOf(nonCrc)}${params ? formatParams(params) : ""}`
}

export const formatParams = (params: Params): string => {
  const keys = Object.keys(params) as Array<keyof Params>
  if (keys.length === 0) return ""

  return "?" + keys.map(k => `${k}=${params[k]}`).join("&")
}

export const parse = (url: string): Link => {
  const { nonCrc, scheme, type, id, crc, params = {} } = parts(url)

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

  return { url, nonCrc, scheme, type, id, crc, params }
}

export const set = (url: string, opts: Partial<LinkArgs>) => {
  const { id, type, params } = parse(url)
  return format({ id, type, params, ...opts })
}

export const setType = (url: string, type: string) => {
  const { id } = parse(url)
  return format({ type, id })
}

export const parts = (url: string): Partial<Link> => {
  const [, /* url */ nonCrc, scheme, type, id, crc, query = ""]: Array<
    string | undefined
  > = url.match(/^((\w+):\/\/(.+)\/(\w+))\/(\w{1,4})(?:\?([&.\w=-]*))?$/) || []
  const params = parseParams(query)
  return { nonCrc, scheme, type, id, crc, params }
}

export const parseParams = (query: string): Params => {
  return query
    .split("&")
    .map(q => q.split("="))
    .reduce(
      (params, [k, v]) => {
        params[k] = parseParam(k, v)
        return params
      },
      {} as any,
    )
}

export function parseParam(k: "height", v: string): number
export function parseParam(k: "width", v: string): number
export function parseParam(k: string, v: string): string
export function parseParam(k: string, v: string): string | number {
  switch (k) {
    case "height":
    case "width":
      return parseFloat(v)

    default:
      return v
  }
}

export const isValidCrc = ({
  nonCrc,
  crc,
}: Pick<Link, "crc" | "nonCrc">): boolean => {
  return crcOf(nonCrc) === crc
}

export const isValidLink = (val: string): boolean => {
  try {
    parse(val)
  } catch {
    return false
  }
  return true
}

export const crcOf = (str: string): string => hexTo58(crc16(str))

export const hexTo58 = (str: string): string =>
  Base58.encode(Buffer.from(str, "hex"))
