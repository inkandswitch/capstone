//import { Doc, AnyDoc, ChangeFn } from "automerge"
import { change, init, getRequests, applyPatch, Doc, AnyDoc, ChangeFn } from "automerge/src/frontend"
///import Frontend from "automerge/src/frontend"

type CommandMessage = "Create" | "Open" | "Replace"

export default class Store {
  open(
    id: string,
    receiveChangeCallback: (message: AnyDoc, port: chrome.runtime.Port) => void,
  ): (ChangeFn: any) => void {

    console.log("Open", id)

    let doc = init()

    var port = chrome.runtime.connect({ name: id })
    port.onMessage.addListener((patches) => {
      console.log("Got patches", patches)
      if (patches.diffs.length > 0) {
        doc = applyPatch(doc,patches)
        receiveChangeCallback(doc, port)
      }
    })
    // i wish this was passing me a change funciton instead
    const sendChangeCallback = (cfn: any) => {
      let newDoc = change(doc,cfn)
      let requests = getRequests(newDoc)
      console.log("Sending Requests", requests);
      doc = newDoc;
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
