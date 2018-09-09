import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import Content from "./Content"
import { Doc } from "automerge"

interface Model {
  docs: Array<{
    url: string
  }>
}

interface State {
  isDropping: boolean
}

export default class SidecarUploader extends Widget<Model, {}, State> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  state = { isDropping: false }

  show({ docs }: Doc<Model>) {
    const { isDropping } = this.state

    return (
      <div
        style={style.SidecarUploader}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}>
        <Content mode="fullscreen" url={this.props.url} />
        <div
          style={{
            ...style.DropStatus,
            ...(isDropping ? style.DropStatus_dropping : {}),
          }}
        />
      </div>
    )
  }

  onDragOver = (event: DragEvent) => {
    event.preventDefault()
    this.setState({ isDropping: true })
  }

  onDragLeave = (event: DragEvent) => {
    this.setState({ isDropping: false })
  }

  onDrop = (event: DragEvent) => {
    event.preventDefault()
    this.setState({ isDropping: false })

    const { items } = event.dataTransfer

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "string") {
        switch (item.type) {
          case "text/plain":
            item.getAsString(str => {
              this.addText(str)
            })
        }
      } else {
        const file = item.getAsFile()
        if (file) {
        }
      }
    }
  }

  async addText(content: string) {
    const url = await Content.create("Text")

    Content.change(url, "Init", doc => {
      doc.content = content.split("")
      return doc
    })

    this.change(doc => {
      doc.docs.push({ url })
      return doc
    })
  }
}

Content.register("SidecarUploader", SidecarUploader)

const style = {
  SidecarUploader: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  DropStatus: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 5,
    border: "3px #222 dashed",
  },
  DropStatus_dropping: {
    borderColor: "skyblue",
  },
}
