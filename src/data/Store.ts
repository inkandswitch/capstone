import { change, init, getRequests, applyPatch, Doc, AnyDoc, ChangeFn, EditDoc } from "automerge/frontend"
import { once } from "lodash"

type CommandMessage = "Create" | "Open" | "Replace"

let DOCS : {[k: string]: Doc<any>} = {}
let RECEIVE : {[k: string]: ((doc: Doc<any>) => void)[] } = {}
let CHANGE : {[k: string]: ((cfn: ChangeFn<any>) => void) } = {}

export default class Store {

  open(
    id: string,
    receiveChangeCallback: (doc: Doc<any>) => void,
  ): (cfn: ChangeFn<any>) => void {

    console.log("Open", id)
    RECEIVE[id] = (RECEIVE[id] || []).concat([receiveChangeCallback])

    if (CHANGE[id]) return CHANGE[id]

    var port = chrome.runtime.connect({ name: id })
    port.onMessage.addListener(({ actorId, patch }) => {
      //console.log("Got patch", patch)
      //console.log("Before", DOCS[id])
      if (DOCS[id] === undefined) { DOCS[id] = init(actorId) }
      if (patch.diffs.length > 0) {
        DOCS[id] = applyPatch(DOCS[id],patch)
      }

      //console.log("After", DOCS[id])
      RECEIVE[id].map(fn => fn(DOCS[id]))
//      receiveChangeCallback(DOCS[id])
    })
    const sendChangeFn = (cfn: ChangeFn<any>) => {
    //  console.log("CHANGE DOC",cfn)
    //  console.log("About to change", DOCS[id])
      DOCS[id] = change(DOCS[id],cfn)
      console.log("All ready", DOCS[id])
      let requests = getRequests(DOCS[id])
      console.log("Sending Requests", requests, DOCS[id]);
      port.postMessage(requests)
      RECEIVE[id].map(fn => fn(DOCS[id]))
      //receiveChangeCallback(DOCS[id])
    }

    CHANGE[id] = sendChangeFn;

    return sendChangeFn
  }

  create(setup: ChangeFn<any>): Promise<string> {
    const command = "Create"
    const args = {}
    console.log("WTF", this)
    

/*
    const setupFn = once(() => {
      console.log("About to setup", DOCS[id])
      DOCS[id] = change(DOCS[id],setup)
    })
*/

    console.log("Lets try and create a doc");
    return new Promise((resolve, reject) => {
      ready.then(() => {
        chrome.runtime.sendMessage({ command, args }, (docId) => {
          console.log("Created:",docId);
          DOCS[docId] = init(docId)
          resolve(docId)
          const changeFn = this.open(docId, (doc) => {} )
          console.log("CHANGE FN", self, changeFn);
          changeFn(setup)
        })
      })
    })
  }
}

console.log("ok lets wait for a message")
let ready = new Promise(resolve => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("ready message", message)
    resolve(message)
  })
})
