import { random } from "lodash/fp"
import * as DiffMatchPatch from "diff-match-patch"
import * as Preact from "preact"
import * as CodeMirror from "codemirror"
import "codemirror/lib/codemirror.css"
import "../styles/styles.css"

// Text editing type definitions
export interface Removal {
  type: "removal"
  at: number
  length: number
}

export interface Insertion {
  type: "insertion"
  at: number
  content: string
}

export type Change = Removal | Insertion

export interface Props {
  content: string
  isFocused: boolean
  onChange: ((_: Change[]) => void)
}

export interface State {
  codeMirror: CodeMirror.Editor
}

export default class TextEditor extends Preact.Component<Props, State> {
  wrapper?: HTMLElement
  codeMirror?: CodeMirror.Editor

  componentDidMount() {
    if (!this.wrapper) return

    this.codeMirror = CodeMirror(this.wrapper, {
      autofocus: this.props.isFocused,
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: "null",
      viewportMargin: Infinity,
    })
    this.codeMirror.setValue(this.props.content)
    this.codeMirror.on("change", this.onCodeMirrorChange)
  }

  componentWillReceiveProps(nextProps: Props) {
    console.log("component will receive props")
    if (!this.codeMirror) return

    if (nextProps.content !== this.props.content) {
      this.updateCodeMirrorContent(nextProps.content)
    }

    this.ensureFocus(nextProps.isFocused)
  }

  // Update the local code mirror instance with new content. We do this with individual operations
  // (rather than just setting the content) to do the right thing for cursor position.
  updateCodeMirrorContent = (newContent: string) => {
    if (!this.codeMirror) return

    const codeMirrorDoc: CodeMirror.Doc = this.codeMirror.getDoc()

    // Short circuit if we don't need to apply any changes to the editor. This
    // happens when we get a text update based on our own local edits.
    const oldContent = codeMirrorDoc.getValue()
    if (oldContent === newContent) {
      return
    }

    // Otherwise find the diff between the current and desired contents, and
    // apply corresponding editor ops to close them.
    const dmp = new DiffMatchPatch.diff_match_patch()
    const diff = dmp.diff_main(oldContent, newContent)
    // The diff lib doesn't give indicies so we need to compute them ourself as
    // we go along.
    let at = 0
    for (let i = 0; i < diff.length; i += 1) {
      const [type, str] = diff[i]
      switch (type) {
        case DiffMatchPatch.DIFF_EQUAL: {
          at += str.length
          break
        }
        case DiffMatchPatch.DIFF_INSERT: {
          const fromPos = codeMirrorDoc.posFromIndex(at)
          codeMirrorDoc.replaceRange(str, fromPos, undefined, "automerge")
          at += str.length
          break
        }
        case DiffMatchPatch.DIFF_DELETE: {
          const fromPos = codeMirrorDoc.posFromIndex(at)
          const toPos = codeMirrorDoc.posFromIndex(at + str.length)
          codeMirrorDoc.replaceRange("", fromPos, toPos, "automerge")
          break
        }
        default: {
          throw new Error(`Did not expect diff type ${type}`)
        }
      }
    }
  }

  ensureFocus = (isFocused: boolean) => {
    if (!this.codeMirror) return
    if (isFocused && !this.codeMirror.hasFocus()) {
      this.codeMirror.focus()
    } else if (!isFocused && this.codeMirror.hasFocus()) {
      console.log("clear focus")
      this.codeMirror.getInputField().blur()
    }
  }

  onCodeMirrorChange = (
    codeMirror: CodeMirror.Editor,
    change: CodeMirror.EditorChange,
  ) => {
    // We don't want to re-apply changes we already applied because of updates
    // from Automerge.
    if (change.origin === "automerge") {
      return
    }

    const codeMirrorDoc = codeMirror.getDoc()
    if (!codeMirrorDoc) return

    // Convert from CodeMirror coordinate space to Automerge text/array API.
    const at = codeMirrorDoc.indexFromPos(change.from)
    const removedLength = change.removed.join("\n").length
    const addedText = change.text.join("\n")

    // Build a list of changes to apply.
    const changes: Change[] = []
    if (removedLength > 0) {
      changes.push({ type: "removal", at: at, length: removedLength })
    }
    if (addedText.length > 0) {
      changes.push({ type: "insertion", at: at, content: addedText })
    }
    this.props.onChange(changes)
  }

  render() {
    return (
      <div
        className="CodeMirrorEditor"
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
