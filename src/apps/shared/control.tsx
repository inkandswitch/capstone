import * as React from "react"
import * as ReactDOM from "react-dom"
import ControlPanel from "../../components/ControlPanel"
import StoreBackend from "../../data/StoreBackend"

const ControlPanelDOM = document.getElementById("ControlPanel")!

export function setupControlPanel(store: StoreBackend) {
  chrome.storage.local.get("controlPanel", data => {
    ControlPanelDOM.style.display = data.controlPanel || "none"
  })
  ReactDOM.render(<ControlPanel store={store} />, ControlPanelDOM)
}

export function toggleControl() {
  const mode = ControlPanelDOM.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ controlPanel: mode })
  ControlPanelDOM.style.display = mode
}
