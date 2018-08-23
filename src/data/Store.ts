import { Doc, AnyDoc, ChangeFn } from "automerge"

type CommandMessage = "Create" | "Open" | "Replace"

export default class Store {
  constructor() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log(
        "store received message (it shouldn't have)",
        request,
        sender,
        sendResponse,
      )
    })
  }

  sendMessage(command: CommandMessage, args: any = {}): Promise<AnyDoc> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, response => {
        resolve(response)
      })
    })
  }

  open(id: string): Promise<AnyDoc> {
    return this.sendMessage("Open", { id })
  }

  create(): Promise<string> {
    let command = "Create"
    let args = {}
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, function(response) {
        resolve(response)
      })
    })
  }

  replace(id: string, doc: AnyDoc): AnyDoc {
    this.sendMessage("Replace", { id, doc })
    return doc
  }

  change<T>(
    id: string,
    doc: Doc<T>,
    msg: string,
    cb: ChangeFn<T>,
  ): Promise<Doc<T>> {
    return new Promise(
      (resolve, reject) =>
        doc
          ? resolve(this.replace(id, cb(doc)) as Doc<T>)
          : reject(new Error("replace failed")),
    )
  }
}
