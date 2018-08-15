import { Url } from "./Link"

export function link(existing: any, fallback: () => Url): string {
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
