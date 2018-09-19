import * as Preact from "preact"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { AnyDoc } from "automerge/frontend"

export interface Model {
  archiveUrl: string
}

interface Props extends Widget.Props<Model> {}

export default class SidecarWorkspace extends Preact.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      archiveUrl: Reify.link(doc.archiveUrl),
    }
  }

  render() {
    const {
      doc: { archiveUrl },
    } = this.props

    return <Content mode="fullscreen" type="SidecarUploader" url={archiveUrl} />
  }
}

Widget.create("SidecarWorkspace", SidecarWorkspace, SidecarWorkspace.reify)
