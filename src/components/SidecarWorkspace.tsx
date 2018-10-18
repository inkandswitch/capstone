import * as React from "react"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
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

    return (
      <Content
        mode="fullscreen"
        url={Link.setType(shelfUrl, "SidecarUploader")}
      />
    )
  }
}

Widget.create("SidecarWorkspace", SidecarWorkspace, SidecarWorkspace.reify)
