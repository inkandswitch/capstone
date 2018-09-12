import { change, init, getRequests, applyPatch, Doc, AnyDoc, ChangeFn } from "automerge/frontend"
///import Frontend from "automerge/frontend"

type CommandMessage = "Create" | "Open" | "Replace"

export default class Store {
  open(
    id: string,
    receiveChangeCallback: (doc: AnyDoc, port: chrome.runtime.Port) => void,
  ): (ChangeFn: any) => void {

    console.log("Open", id)

    let doc : any = null;

    var port = chrome.runtime.connect({ name: id })
    port.onMessage.addListener(({ actorId, patch }) => {
      console.log("Got patch", patch)
      if (doc === null) { doc = init(actorId) }
      if (patch.diffs.length > 0) {
        doc = applyPatch(doc,patch)
        receiveChangeCallback(doc, port)
      }
    })
    // i wish this was passing me a change funciton instead
    const sendChangeCallback = (cfn: any) => {
      doc = change(doc,cfn)
      let requests = getRequests(doc)
      console.log("Sending Requests", requests);
      port.postMessage(requests)
      receiveChangeCallback(doc, port)
    }
    return sendChangeCallback
  }

  create(): Promise<string> {
    const command = "Create"
    const args = {}
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, function(response) {
        resolve(response)
      })
    })
  }
}
