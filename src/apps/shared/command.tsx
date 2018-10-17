import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Link from "../../data/Link"
import StoreBackend from "../../data/StoreBackend"

import ControlPanel from "../../components/ControlPanel"

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

export function setupControlPanel(store: StoreBackend) {
  // why is this so terrible??

  let oldWorkspace: string | null = null

  function saveState(state: ControlState): void {
    chrome.storage.local.set({ controlPanelState: state })
    if (state.workspaceUrl !== oldWorkspace) {
      store.sendToFrontend({ type: "SetWorkspace", url: state.workspaceUrl })
    }

    ReactDOM.render(<ControlPanel state={state} tools={tools} />, DebugPane)
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

  chrome.storage.local.get("controlPanelState", result => {
    let { controlPanelState } = result
    let state = controlPanelState || { workspaceUrl: "", history: [] }

    console.log("controlPanelState", state)

    if (state.workspaceUrl === "") {
      newWorkspace(state)
    } else {
      saveState(state)
    }
  })
}

export function setDebugPanel() {
  chrome.storage.local.get("debugPanel", data => {
    DebugPane.style.display = data.debugPanel
  })
  DebugPane.style.display =
    DebugPane.style.display === "block" ? "none" : "block"
}

export function toggleDebug() {
  console.log("Toggling debug pane")
  const mode = DebugPane.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ debugPanel: mode })
  setDebugPanel()
}
