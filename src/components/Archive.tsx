import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"

export interface Model {
  docs: Array<{
    url: string
  }>
}

export default class Archive extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  show({ docs }: Model) {
    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {docs.map(({ url }) => (
            <div style={style.Item}>
              <Content mode="preview" url={url} />
            </div>
          ))}
        </div>
      </div>
    )
  }
}

const style = {
  Archive: {
    backgroundColor: "rgba(97, 101, 117, 0.9)",
    color: "#fff",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    zIndex: 1,
  },

  Items: {
    display: "flex",
    height: 200,
    alignItems: "center",
  },

  Item: {
    marginRight: 10,
    marginTop: 10,
    maxWidth: 200,
    maxHeight: 200,
    position: "relative",
    backgroundColor: "#fff",
  },
}

Content.register("Archive", Archive)
