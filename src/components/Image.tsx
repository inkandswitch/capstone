import { random } from "lodash/fp"
import * as Preact from "preact"
import { AnyDoc } from "automerge/frontend"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"

export interface Model {
  src: string
}

export interface Props extends Widget.Props<Model> {
  src: string
}

class Image extends Preact.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      src: Reify.string(doc.src, sample),
    }
  }

  render() {
    const { src } = this.props.doc
    return <img style={style.Image} src={src} />
  }
}

const style = {
  Image: {
    objectFit: "cover",
    pointerEvents: "none",
    display: "block",
    // width: "auto",
    // height: "auto",
    maxWidth: "100%",
    maxHeight: "100%",
  },
}

const sample = (): string => samples[random(1, samples.length) - 1]

const samples = [
  require("../assets/leonardo_polyhedra.png"),
  require("../assets/leonardo_anatomy.jpg"),
  require("../assets/leonardo_hoist.jpg"),
]

export default Widget.create("Image", Image, Image.reify)
