import { change } from "automerge"

declare module "hypermerge" {
  type Key = Buffer
  type Id = string

  interface DocHandle {
    get(): any
    change(cb: any): void
  }
}
