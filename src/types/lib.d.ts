import Store from "../data/Store"

declare global {
  function require(path: string): any
  interface Window {
    store?: Store
  }
}
