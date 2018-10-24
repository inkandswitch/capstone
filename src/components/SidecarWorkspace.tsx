import * as React from "react"
import { AnyDoc } from "automerge/frontend"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as DataImport from "./DataImport"
import Content, { ReceiveDocuments } from "./Content"
import GPSInput from "./GPSInput"
import Clipboard from "./Clipboard"

export interface Model {
  shelfUrl: string
}

interface Props extends Widget.Props<Model, WidgetMessage> {}

type WidgetMessage = ReceiveDocuments

export default class SidecarWorkspace extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return { shelfUrl: Reify.link(doc.shelfUrl) }
  }

  render() {
    const { doc } = this.props

    return (
      <div>
        <GPSInput />
        <Clipboard onPaste={this.onPaste} />
        <Content mode="fullscreen" noInk url={doc.shelfUrl} />
      </div>
    )
  }

  onPaste = (e: ClipboardEvent) => {
    this.importData(e.clipboardData)
  }

  importData = (dataTransfer: DataTransfer) => {
    const urlPromises = DataImport.importData(dataTransfer)
    Promise.all(urlPromises).then(urls => {
      this.props.emit({
        to: this.props.doc.shelfUrl,
        type: "ReceiveDocuments",
        body: { urls },
      })
    })
  }
}

Widget.create("SidecarWorkspace", SidecarWorkspace, SidecarWorkspace.reify)
