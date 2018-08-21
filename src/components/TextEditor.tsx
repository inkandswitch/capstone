import { random } from "lodash/fp"
import * as Preact from "preact"
import * as CodeMirror from "codemirror"
import "codemirror/lib/codemirror.css"
import "../styles/styles.css"

export interface Props {
  content: string
}

export interface State {
  codeMirror: CodeMirror.Editor
}

export default class TextEditor extends Preact.Component<Props, State> {
  wrapper?: HTMLElement

  componentDidMount() {
    if (!this.wrapper) return

    let codeMirror = CodeMirror(this.wrapper, {
      autofocus: false, //this.props.uniquelySelected,
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: "null",
      viewportMargin: Infinity,
    })
    codeMirror.setValue(this.props.content)

    this.setState({
      codeMirror: codeMirror,
    })
  }

  onKeyDown = (e: KeyboardEvent) => {
    console.log("key pressed")
    // if (e.key !== 'Backspace') {
    //   this.stallDelete = true
    // }
    // if (!this.stallDelete) {
    //   // we normally prevent deletion by stopping event propagation
    //   // but if the card is already empty and we hit delete, allow it
    //   return
    // }
    // if (e.key === 'Backspace' && this.state.text.length === 0) {
    //   this.stallDelete = false
    // }

    // e.stopPropagation()
  }

  render() {
    return (
      <div
        className="CodeMirrorEditor"
        onKeyDown={this.onKeyDown}
        ref={(el: HTMLElement) => (this.wrapper = el)}
        style={style.Text}
      />
    )
  }
}

const style = {
  Text: {
    fontSize: 16,
    padding: 10,
    color: "#333",
    lineHeight: 1.5,
    position: "relative",
  },
}
