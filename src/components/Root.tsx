import * as Preact from "preact"
import Store from "../data/Store"

interface Props {
  store: Store
}

export default class Root extends Preact.Component<Props> {
  getChildContext() {
    return {
      store: this.props.store,
    }
  }

  render() {
    const child =
      (this.props.children instanceof Array && this.props.children[0]) || null
    return child
  }
}
