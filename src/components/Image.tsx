import * as React from "react"
import { AnyDoc } from "automerge/frontend"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"

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
    return <img style={style.Image} src={src} />
  }
}

const style = {
  Image: {
    objectFit: "cover" as "cover",
    pointerEvents: "none" as "none",
    display: "block",
    height: "100%",
    width: "100%",
  },
}

export default Widget.create("Image", Image, Image.reify)
