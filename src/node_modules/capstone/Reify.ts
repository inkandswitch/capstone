import { Url } from "./Link"
import { AnyDoc, Doc, Text } from "automerge/frontend"
import { defaults } from "lodash"

export function reify<T>(doc: AnyDoc, reifyFn: (doc: AnyDoc) => T): Doc<T> {
  return <Doc<T>>defaults(doc, reifyFn(doc))
}

export function link(existing: any, fallback: () => Url = () => ""): string {
  return typeof existing === "string" ? existing : fallback()
}

export function text(
  existing: any,
  fallback: () => Text = () => new Text(),
): Text {
  return existing instanceof Text ? existing : fallback()
}

export function array<T>(
  existing: any,
  fallback: () => Array<T> = () => [],
): Array<T> {
  return Array.isArray(existing) ? existing : fallback()
}

export function map<T>(
  existing: any,
  fallback: () => { [k: string]: T } = () => ({}),
): { [k: string]: T } {
  return Object.prototype.toString.call(existing) === "[object Object]"
    ? existing
    : fallback()
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

export function boolean(
  existing: any,
  fallback: () => boolean = () => false,
): boolean {
  return typeof existing === "boolean" ? existing : fallback()
}
