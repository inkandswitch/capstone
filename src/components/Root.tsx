import * as React from "react"
import { Store } from "capstone"

interface Props {
  store: Store
}

export default class Root extends React.Component<Props> {
  render() {
    const { children } = this.props
    const childArray = React.Children.toArray(children)

    const child = childArray ? childArray[0] : null

    if (!child || !React.isValidElement(child)) {
      return null
    }

    return child
  }
}
