import * as React from "react"
import * as Reify from "../../data/Reify"
import * as Widget from "../../components/Widget"
import { AnyDoc } from "automerge/frontend"

export interface Model {
  id: string
  code: string
}

interface Props extends Widget.Props<Model> {}

interface State {
  err?: string
}

class Bot extends React.Component<Props, State> {
  state = {
    err: undefined,
  }

  static reify(doc: AnyDoc): Model {
    return {
      id: Reify.string(doc.id),
      code: Reify.string(doc.string),
    }
  }

  componentDidMount() {
    this.runCode()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.doc.code !== prevProps.doc.code) {
      this.runCode()
    }
  }

  runCode = () => {
    const { code } = this.props.doc
    let err

    try {
      eval(`(() => { ${code} })()`)
    } catch (e) {
      err = e
    }

    this.setState({ err })
  }

  render() {
    return null
  }
}

export default Widget.create("Bot", Bot, Bot.reify)