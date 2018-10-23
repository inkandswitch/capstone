import * as React from "react"
import * as ReactDOM from "react-dom"
import ControlPanel from "../../components/ControlPanel"
import Store from "../../data/Store"

let ControlPanelDOM : null | HTMLElement = null

export function setupControlPanel(store: Store) {
  ControlPanelDOM = document.getElementById("ControlPanel")!
  const mode = localStorage.controlPanel || "none"
  ControlPanelDOM.style.display = mode
  ReactDOM.render(<ControlPanel store={store} />, ControlPanelDOM)
}

export function toggleControl() {
  const mode = ControlPanelDOM!.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ controlPanel: mode })
  localStorage.controlPanel = mode
  ControlPanelDOM!.style.display = mode
}
