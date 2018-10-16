import * as React from "react"

import FullscreenToggle from "./FullscreenToggle"
interface Props {
  hello: string
}
interface State {}

export default class ControlPannel extends React.Component<Props, State> {
  componentDidMount() {
  }

  update = () => {
  }

  componentWillUnmount() {
  }

  render() {
    return <div> <FullscreenToggle /> </div>
  }
}
