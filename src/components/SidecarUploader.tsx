import * as Preact from "preact"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import Content from "./Content"
import { Doc, AnyDoc, AnyEditDoc } from "automerge"

interface Model {
  docs: Array<{
    url: string
  }>
}

interface Props extends Widget.Props<Model> {}

interface State {
  isDropping: boolean
}

export default class SidecarUploader extends Preact.Component<Props, State> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  state = { isDropping: false }

  render() {
    const {
      doc: { docs },
    } = this.props
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
    event.stopPropagation()

    this.setState({ isDropping: false })
    this.importItems(event.dataTransfer)
    this.importFiles(event.dataTransfer)
  }

  importItems({ items }: DataTransfer) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "string") {
        switch (item.type) {
          case "text/plain":
            item.getAsString(str => {
              this.addText(str)
            })
        }
      }
    }
  }

  importFiles({ files }: DataTransfer) {
    const { length } = files

    for (let i = 0; i < length; i++) {
      const entry = files[i]

      if (entry.type.match("text/")) {
        const reader = new FileReader()
        reader.readAsText(entry)

        reader.onload = () => {
          const { result } = reader
          if (typeof result === "string") this.addText(result)
        }
      }
    }
  }

  async addText(content: string) {
    const url = await Content.create("Text")

    // HACK these types are wacky, fix after store api changes
    let done = false
    const replace = Content.open(url, (doc: AnyEditDoc) => {
      if (done) return
      doc.content = content.split("")
      replace(doc)
      done = true
    })

    this.props.change(doc => {
      doc.docs.push({ url })
      return doc
    })
  }
}

Widget.create("SidecarUploader", SidecarUploader, SidecarUploader.reify)

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
