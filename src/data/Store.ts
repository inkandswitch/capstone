import { Doc, AnyDoc, ChangeFn, EditDoc } from "automerge"
import * as Rx from "rxjs"

type CommandMessage = "Create" | "Open" | "Replace"

interface UploadActivity {
  type: "Upload"
  actorId: string
  seq: number
}

interface DownloadActivity {
  type: "Download"
  actorId: string
  seq: number
}

export type Activity = UploadActivity | DownloadActivity

export default class Store {
  open(
    id: string,
    receiveChangeCallback: (message: any, port: chrome.runtime.Port) => void,
  ): (newDoc: any) => void {
    const port = chrome.runtime.connect({ name: `${id}/changes` })
    port.onMessage.addListener(receiveChangeCallback)
    const sendChangeCallback = (newDoc: any) => {
      port.postMessage(newDoc)
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

  activity(id: string): Rx.Observable<Activity> {
    return new Rx.Observable(obs => {
      const port = chrome.runtime.connect({ name: `${id}/activity` })
      port.onMessage.addListener(msg => obs.next(msg))
      port.onDisconnect.addListener(() => obs.complete())
    })
  }
}
