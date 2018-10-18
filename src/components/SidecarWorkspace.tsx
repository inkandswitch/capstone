import * as React from "react"
import { AnyDoc } from "automerge/frontend"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import Content from "./Content"
import GPSInput from "./GPSInput"

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
    const { doc } = this.props

    return (
      <div>
        <GPSInput />
        <Content mode="fullscreen" url={doc.shelfUrl} />
      </div>
    )
  }
}

Widget.create("SidecarWorkspace", SidecarWorkspace, SidecarWorkspace.reify)
