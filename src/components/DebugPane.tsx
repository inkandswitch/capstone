import * as React from "react"

interface Props {
  hello: string
}
interface State {}

export default class DebugPane extends React.Component<Props, State> {
  componentDidMount() {
  }

  update = () => {
  }

  componentWillUnmount() {
  }

  render() {
    return <div> DebugPane </div>
  }
}
