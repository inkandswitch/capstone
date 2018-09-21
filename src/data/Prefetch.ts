import * as Link from "./Link"
import * as Traverse from "../logic/Traverse"

export class Prefetcher {
  hypermerge: any
  handles: { [docId: string]: any }

  constructor(hypermerge: any, handlesCache: { [docId: string]: any }) {
    this.hypermerge = hypermerge
    this.handles = handlesCache
  }

  onDocumentUpdate = (docId: string) => {
    console.log("Document updated", docId)
    const front = this.getDocFront(docId)
    Traverse.recursiveDFS(front, this.ensureLinkedDocumentsAreOpen)
  }

  getDocFront(id: string) {
    const handle = this.getHandle(id)
    return handle._front
  }

  ensureLinkedDocumentsAreOpen = (val: any) => {
    if (!this.isDocumentLink(val)) return

    const { id } = Link.parse(val)
    this.ensureOpen(id)
  }

  isDocumentLink(val: any) {
    return Traverse.isString(val) && Link.isValidLink(val)
  }

  ensureOpen(id: string) {
    console.log("Ensuring document is open", id)
    this.getHandle(id)
  }

  getHandle(id: string) {
    if (!this.handles[id]) {
      // Hack to set up front
      const handle = this.hypermerge.openHandle(id)
      handle._isManagingFront = true
      handle._setupFront()
      this.handles[id] = handle
    }
    return this.handles[id]
  }
}
