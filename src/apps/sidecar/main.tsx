import * as React from "react"
import * as ReactDOM from "react-dom"
import SidecarApp from "../../components/SidecarApp"
import Content from "../../components/Content"
import Store from "../../data/Store"
import bootstrap from "../shared/bootstrap"

// Used for debugging from the console:
window.Content = Content

Content.store = new Store()

bootstrap(Content.store)

ReactDOM.render(<SidecarApp />, document.getElementById("main"))
