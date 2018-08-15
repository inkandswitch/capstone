import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"

export interface Model {
  src: string
}

export default class Image extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      src: Reify.string(doc.src, sample),
    }
  }

  show({ src }: Model) {
    return <img style={style.Image} src={src} />
  }
}

Content.register("Image", Image)

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
