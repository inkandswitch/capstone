import { Doc, AnyDoc, ChangeFn } from "automerge"

type CommandMessage = "Create" | "Open" | "Replace"

export default class Store {
  open(
    id: string,
    changeCallback: (message: any, port: chrome.runtime.Port) => void,
  ): (newDoc: any) => void {
    var port = chrome.runtime.connect({ name: id })
    port.onMessage.addListener(changeCallback)
    const replaceCallback = (newDoc: any) => {
      port.postMessage(newDoc)
    }
    return replaceCallback
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
