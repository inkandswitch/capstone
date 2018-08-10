import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget from "./Widget"
import Content from "./Content"

export interface Model {
  src: string
}

export default class Image extends Widget<Model> {
  defaults(): Model {
    return {
      src: samples[random(1, samples.length) - 1],
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
    width: "100%",
    height: "auto",
  },
}

const samples = [
  require("../assets/leonardo_polyhedra.png"),
  require("../assets/leonardo_anatomy.jpg"),
  require("../assets/leonardo_hoist.jpg"),
]