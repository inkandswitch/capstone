import * as Preact from "preact"
import * as Reify from "../data/Reify"
import Widget from "./Widget"
import { AnyDoc } from "automerge"
import ShelfCard from "./ShelfCard"

interface Model {
  selectedUrls: string[]
}

interface Props {}

export default class Shelf extends Widget<Model, Props> {
  static reify(doc: AnyDoc): Model {
    return {
      selectedUrls: Reify.array(doc.selectedUrls),
    }
  }

  show({ selectedUrls }: Model) {
    const count = selectedUrls.length

    if (count <= 0) return null

    return (
      <div style={style.Shelf}>
        {selectedUrls.map((url, idx) => (
          <ShelfCard url={url} index={idx} onTap={this.toggleSelect} />
        ))}
        <div style={style.Count}>{count}</div>
      </div>
    )
  }

  toggleSelect = (url: string) => {
    this.change(doc => {
      const idx = doc.selectedUrls.indexOf(url)
      if (idx >= 0) {
        doc.selectedUrls.splice(idx, 1)
      } else {
        doc.selectedUrls.push(url)
      }
    })
  }
}

const style = {
  Shelf: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: -50,
    boxSizing: "border-box",
    borderRadius: 9999,
    height: 300,
    width: 300,
    backgroundColor: "#7B7E8E",
    zIndex: 2,
  },

  Count: {
    position: "absolute",
    top: 175,
    left: 135,
    transform: "translate(-50%, -50%)",
    borderRadius: 99,
    backgroundColor: "rgba(215, 105, 250, 0.9)",
    color: "white",
    fontSize: 20,
    display: "flex",
    placeContent: "center",
    alignItems: "center",
    minHeight: 40,
    minWidth: 40,
  },
}
