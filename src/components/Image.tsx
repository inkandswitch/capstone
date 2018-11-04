import * as React from "react"
import { AnyDoc } from "automerge/frontend"
import { Widget, Reify } from "capstone"
import * as css from "./css/Image.css"

export interface Model {
  src: string
}

export interface Props extends Widget.Props<Model> {
  src: string
}

class Image extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      src: Reify.string(doc.src),
    }
  }

  render() {
    const { src } = this.props.doc
    return <img className={css.Image} src={src} />
  }
}

export default Widget.create("Image", Image, Image.reify)
