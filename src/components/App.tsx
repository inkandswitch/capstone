import * as Preact from "preact"

import Store from "../data/Store"
import * as Link from "../data/Link"
import Root from "./Root"
import Content from "./Content"

import "./Board"
import "./Image"
import "./Text"
import "./Workspace"

// Used for debugging from the console:
window.Content = Content

Content.store = new Store()

export default class App extends Preact.Component {
  render() {
    // TODO: get url from persistent storage
    const url = Link.format({ type: "Workspace", id: "id0" })

    return (
      <Root store={Content.store}>
        <div style={style.App}>
          <Content url={url} />
        </div>
      </Root>
    )
  }
}

const style = {
  App: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}
