import * as React from "react"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { AnyDoc } from "automerge/frontend"

export interface Model {
  shelfUrl: string
}

interface Props extends Widget.Props<Model> {}

export default class SidecarWorkspace extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      shelfUrl: Reify.link(doc.shelfUrl),
    }
  }

  render() {
    const {
      doc: { shelfUrl },
    } = this.props

    return <Content mode="fullscreen" type="SidecarUploader" url={shelfUrl} />
  }
}

Widget.create("SidecarWorkspace", SidecarWorkspace, SidecarWorkspace.reify)
