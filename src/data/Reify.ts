import { Url } from "./Link"
import { AnyDoc, Doc } from "automerge"
import { defaults } from "lodash"

export function reify<T>(doc: AnyDoc, reifyFn: (doc: AnyDoc) => T): Doc<T> {
  return <Doc<T>>defaults(doc, reifyFn(doc))
}

export function link(existing: any, fallback: () => Url = () => ""): string {
  return typeof existing === "string" ? existing : fallback()
}

export function array<T>(
  existing: any,
  fallback: () => Array<T> = () => [],
): Array<T> {
  return Array.isArray(existing) ? existing : fallback()
}

export function number(
  existing: any,
  fallback: () => number = () => 0,
): number {
  return typeof existing === "number" ? existing : fallback()
}

export function string(
  existing: any,
  fallback: () => string = () => "",
): string {
  return typeof existing === "string" ? existing : fallback()
}
