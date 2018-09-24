import * as Link from "./Link"
import * as Traverse from "../logic/Traverse"
import { isString } from "lodash"

type handlesCache = { [docId: string]: any }

export class Prefetcher {
  hypermerge: any
  handles: handlesCache

  constructor(hypermerge: any, handles: handlesCache) {
    this.hypermerge = hypermerge
    this.handles = handles
  }

  onDocumentUpdate = (doc: any) => {
    // TODO: we parse links twice - once in `isDocumentLink` and once in `ensureDocumentIsOpen`
    // TODO: Use plugin-specific prefetch functions, using iterativeDFS only as a fallback.
    const documentLinks = Traverse.iterativeDFS(doc, this.isDocumentLink)
    documentLinks.forEach(this.ensureDocumentIsOpen)
  }

  isDocumentLink(val: any) {
    return isString(val) && Link.isValidLink(val)
  }

  ensureDocumentIsOpen = (val: any) => {
    const { id } = Link.parse(val)
    this.getHandle(id)
  }

  getHandle(id: string) {
    if (!this.handles[id]) {
      const handle = this.hypermerge.openHandle(id)
      handle.onChange(this.onDocumentUpdate)
      this.handles[id] = handle
    }
    return this.handles[id]
  }
}
