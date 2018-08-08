import { random } from "lodash/fp"
import * as Preact from "preact"
import Base from "./Base"
import Content from "./Content"

export interface Model {
  src: string
}

export default class Image extends Base<Model> {
  defaults(): Model {
    return {
      src: samples[random(1, samples.length) - 1],
    }
  }

  show({ src }: Model) {
    return <img src={src} />
  }
}

Content.register("Image", Image)

const samples = [
  require("../assets/leonardo_polyhedra.png"),
  require("../assets/leonardo_anatomy.jpg"),
  require("../assets/leonardo_hoist.jpg"),
]
