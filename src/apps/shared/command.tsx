import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../../data/Link"
import StoreBackend from "../../data/StoreBackend"

import ControlPannel from "../../components/ControlPannel"

export interface ControlState {
  workspaceUrl: string
  history: string[]
}

export interface ControlTools {
  saveState: (state: ControlState) => void
  newWorkspace: (state: ControlState) => void
  setWorkspace: (state: ControlState, url: string) => void
}

export interface ControlProps {
  state: ControlState
  tools: ControlTools
}

const DebugPane = document.getElementById("DebugPane")!

export function setupControlPannel(store: StoreBackend) {
  // why is this so terrible??

  let oldWorkspace: string | null = null

  function saveState(state: ControlState): void {
    chrome.storage.local.set({ controlPannelState: state })
    if (state.workspaceUrl !== oldWorkspace) {
      store.sendToFrontend({ type: "SetWorkspace", url: state.workspaceUrl })
    }

    ReactDOM.render(<ControlPannel state={state} tools={tools} />, DebugPane)
    oldWorkspace = state.workspaceUrl
  }

  function newWorkspace(state: ControlState) {
    const handle = store.hypermerge.createDocumentFrontend<any>()
    const link = Link.format({ type: "Workspace", id: handle.docId })
    handle.change(doc => {
      doc.navStack = []
      doc.rootUrl  = ""
      doc.shelfUrl = ""
    })
    setWorkspace(state, link)
  }

  function setWorkspace(state: ControlState, url: string) {
    const parsed = Link.parse(url)
    if (state.workspaceUrl != "") {
      state.history.unshift(state.workspaceUrl)
    }
    state.workspaceUrl = url
    state.history = state.history.filter(u => u !== url).slice(0, 10)
    saveState(state)
  }

  const tools = { saveState, newWorkspace, setWorkspace }

  chrome.storage.local.get("controlPannelState", result => {
    let { controlPannelState } = result
    let state = controlPannelState || { workspaceUrl: "", history: [] }

    console.log("controlPannelState", state)

    if (state.workspaceUrl === "") {
      newWorkspace(state)
    } else {
      saveState(state)
    }
  })
}

export function setDebugPannel() {
  chrome.storage.local.get("debugPannel", data => {
    DebugPane.style.display = data.debugPannel
  })
  DebugPane.style.display =
    DebugPane.style.display === "block" ? "none" : "block"
}

export function toggleDebug() {
  console.log("Toggling debug pane")
  const mode = DebugPane.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ debugPannel: mode })
  setDebugPannel()
}
