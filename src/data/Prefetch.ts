import * as Link from "./Link"
import * as Traverse from "../logic/Traverse"
import { isString } from "lodash"
import { Hypermerge } from "../modules/hypermerge"

type handlesCache = { [docId: string]: any }

export class Prefetcher {
  hypermerge: Hypermerge
  handles: handlesCache

  constructor(hypermerge: Hypermerge, handles: handlesCache) {
    this.hypermerge = hypermerge
    this.handles = handles
  }

  onDocumentUpdate = (doc: any) => {
    // TODO: we parse links twice - once in `isDocumentLink` and once in `ensureDocumentIsOpen`
    // TODO: Use plugin-specific prefetch functions, using iterativeDFS only as a fallback.
    const documentLinks = Traverse.iterativeDFS<string>(
      doc,
      this.isDocumentLink,
    )
    documentLinks.forEach(this.ensureDocumentIsOpen)
  }

  isDocumentLink(val: unknown): boolean {
    return isString(val) && Link.isValidLink(val)
  }

  ensureDocumentIsOpen = (val: string) => {
    const { id, type } = Link.parse(val)
    this.getHandle(id)
  }

  getHandle(id: string) {
    if (!this.handles[id]) {
      const handle = this.hypermerge.openHandle(id)
      this.handles[id] = handle
      // IMPORTANT: the handle must be cached in `this.handles` before setting the onChange
      // callback. The `onChange` callback is invoked as soon as it is set, in the same tick.
      // This can cause infinite loops if the handlesCache isn't set.
      //setImmediate(() => handle.onChange(this.onDocumentUpdate))
    }
    return this.handles[id]
  }
}
