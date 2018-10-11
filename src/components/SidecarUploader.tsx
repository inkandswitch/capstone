import * as React from "react"
import { once } from "lodash"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as DataTransfer from "../logic/DataTransfer"
import Content from "./Content"
import { AnyDoc, AnyEditDoc, ChangeFn } from "automerge/frontend"
import Clipboard from "./Clipboard"
import * as DataImport from "./DataImport"

interface Model {
  selectedUrls: Array<string>
}

interface Props extends Widget.Props<Model> {}

interface State {
  isDropping: boolean
}

export default class SidecarUploader extends React.Component<Props, State> {
  static reify(doc: AnyDoc): Model {
    return {
      selectedUrls: Reify.array(doc.selectedUrls),
    }
  }

  state = { isDropping: false }

  render() {
    const {
      doc: { selectedUrls },
    } = this.props
    const { isDropping } = this.state

    return (
      <div
        style={style.SidecarUploader}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}>
        <Clipboard onPaste={this.onPaste} />
        <div style={style.Status} />
        <div
          style={{
            ...style.DropArea,
            ...(isDropping ? style.DropArea_dropping : {}),
          }}>
          <div style={style.DropTitle}>Drop files here</div>
          <div style={style.Plus}>+</div>
        </div>
      </div>
    )
  }

  onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    this.setState({ isDropping: true })
  }

  onDragLeave = (event: React.DragEvent) => {
    this.setState({ isDropping: false })
  }

  onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    this.setState({ isDropping: false })
    this.importData(event.dataTransfer)
  }

  onPaste = (event: ClipboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    this.importData(event.clipboardData)
  }

  importData(dataTransfer: DataTransfer) {
    const urlPromises = DataImport.importData(dataTransfer)
    Promise.all(urlPromises).then(urls => {
      this.props.change(doc => {
        doc.selectedUrls = doc.selectedUrls.concat(urls)
        return doc
      })
    })
  }
}

Widget.create("SidecarUploader", SidecarUploader, SidecarUploader.reify)

const style = {
  SidecarUploader: {
    position: "absolute" as "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: "grid",
    gridTemplateAreas: `"status" "drop"`,
    gridTemplateRows: "auto 1fr",
  },

  Status: {
    gridArea: "status",
  },

  DropArea: {
    margin: 10,
    border: "3px #D0D0D0 dashed",
    gridArea: "drop",
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    justifyContent: "center",
  },
  DropArea_dropping: {
    borderColor: "#73BE8D",
  },

  DropTitle: {
    fontSize: 30,
    color: "#848484",
  },

  Plus: {
    fontSize: 50,
    color: "#D0D0D0",
  },
}
