import { change, init, getRequests, applyPatch, Doc, AnyDoc, ChangeFn, EditDoc } from "automerge/frontend"
import { once } from "lodash"

type CommandMessage = "Create" | "Open" | "Replace"

let DOCS : {[k: string]: Doc<any>} = {}
let RECEIVE : {[k: string]: ((doc: Doc<any>) => void)[] } = {}
let CHANGE : {[k: string]: ((cfn: ChangeFn<any>) => void) } = {}

export default class Store {

  once(
    id: string,
    cb: (doc: Doc<any>, cfn: ChangeFn<any>) => void,
  ): void {
    if (DOCS[id]) {
      cb(DOCS[id], CHANGE[id])
    } else {
      // YUK!
      let change = this.open(id, (doc) => {
        cb(doc,change)
      })
    }
  }

  open(
    id: string,
    receiveChangeCallback: (doc: Doc<any>) => void,
  ): (cfn: ChangeFn<any>) => void {

    console.log("Open", id)
    RECEIVE[id] = (RECEIVE[id] || []).concat([receiveChangeCallback])

    if (DOCS[id]) setTimeout( () => receiveChangeCallback(DOCS[id]),50) /// UGHHHH!! :'(

    if (CHANGE[id]) return CHANGE[id]

    var port = chrome.runtime.connect({ name: id })
    port.onMessage.addListener(({ actorId, patch }) => {
      if (DOCS[id] === undefined) { DOCS[id] = init(actorId) }
      if (patch.diffs.length > 0) {
        DOCS[id] = applyPatch(DOCS[id],patch)
      }

      RECEIVE[id].map(fn => fn(DOCS[id]))
    })
    const sendChangeFn = (cfn: ChangeFn<any>) => {
      DOCS[id] = change(DOCS[id],cfn)
      console.log("All ready", DOCS[id])
      let requests = getRequests(DOCS[id])
      console.log("Sending Requests", requests, DOCS[id]);
      port.postMessage(requests)
      RECEIVE[id].map(fn => fn(DOCS[id]))
    }

    CHANGE[id] = sendChangeFn;

    return sendChangeFn
  }

  create(setup: ChangeFn<any>): Promise<string> {
    const command = "Create"
    const args = {}

    return new Promise((resolve, reject) => {
      POST_MESSAGE_TO_BUS({ command, args }, (docId) => {
//      chrome.runtime.sendMessage({ command, args }, (docId) => {
        console.log("Created:",docId);
        DOCS[docId] = init(docId)
        resolve(docId)
        const changeFn = this.open(docId, (doc) => {} )
        changeFn(setup)
      })
    })
  }
}

function POST_MESSAGE_TO_BUS(request : any, cb: Function) {
  const id = Math.floor(Math.random() * 2000000000)
  BUS_CALLBACKS[id] = cb
  console.log("posting message to bus",id,request);
  BUS.postMessage({id, request})
}
var BUS_CALLBACKS : {[k: number]: Function}  = {}
var BUS = chrome.runtime.connect({ name: "bus" })
BUS.onMessage.addListener((message : any) => {
  const { id, response } = message
  BUS_CALLBACKS[id](response)
  delete BUS_CALLBACKS[id]
})
