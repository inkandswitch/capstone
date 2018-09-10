//import { Doc, AnyDoc, ChangeFn } from "automerge"
import { init, getRequests, applyPatch, Doc, AnyDoc, ChangeFn } from "automerge/src/frontend"
///import Frontend from "automerge/src/frontend"

type CommandMessage = "Create" | "Open" | "Replace"

export default class Store {
  open(
    id: string,
    receiveChangeCallback: (message: any, port: chrome.runtime.Port) => void,
  ): (newDoc: any) => void {

    let doc = init()

    var port = chrome.runtime.connect({ name: id })
    port.onMessage.addListener((patch) => {
      doc = applyPatch(doc,patch)
      receiveChangeCallback(doc, port)
    })
    // i wish this was passing me a change funciton instead
    const sendChangeCallback = (newDoc: any) => {
      let requests = getRequests(doc)
      doc = newDoc;
      port.postMessage(requests)
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
