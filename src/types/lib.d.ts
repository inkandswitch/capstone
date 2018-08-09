import Store from "../data/Store"

declare global {
  function require(path: string): any
  interface Window {
    store?: Store
  }

  interface Object {
    values<T>(obj: { [k: string]: T }): T[]
    values(obj: object): any[]
  }
}
