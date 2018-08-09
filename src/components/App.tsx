import * as Preact from "preact"

import Store from "../data/Store"
import Root from "./Root"
import Content from "./Content"

// import "./Archive"
import "./Board"
import "./Image"
import "./Text"
import "./Workspace"

export default class App extends Preact.Component {
  store: Store = (window.store = new Store())

  render() {
    return (
      <Root store={this.store}>
        <div style={style.App}>
          <Content type="Workspace" id="id0" />
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
