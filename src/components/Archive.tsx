import { random } from "lodash/fp"
import * as Preact from "preact"
import Widget, { AnyDoc, Doc } from "./Widget"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import Content, { Mode } from "./Content"
import ArchiveItem from "./ArchiveItem"

export interface Model {
  docs: Array<{
    url: string
  }>
}

export interface Props {
  selected: string[]
  onTap: (id: string) => void
}

// TODO: extract
export class ArchiveManager {
  static updateCallbacks: {
    [archiveUrl: string]: (newDoc: Doc<Model>) => void
  } = {}
  static register(archiveUrl: string, callback: (newDoc: Doc<Model>) => void) {
    ArchiveManager.updateCallbacks[archiveUrl] = callback
  }
  static unregister(archiveUrl: string) {
    delete ArchiveManager.updateCallbacks[archiveUrl]
  }

  static async onMessage(
    archiveUrl: string,
    message: { type: string; payload: any },
  ) {
    const archive = await Content.open<Model>(archiveUrl)
    const { id } = Link.parse(archiveUrl)

    if (message.type === "AddDocument") {
      const documentUrl = message.payload
      const updatedDoc = await Content.store.change(
        id,
        archive,
        "",
        (doc: Doc<Model>) => {
          doc.docs.push({ url: documentUrl })
          return doc
        },
      )

      if (ArchiveManager.updateCallbacks[archiveUrl]) {
        ArchiveManager.updateCallbacks[archiveUrl](updatedDoc)
      }
    }
  }
}

export default class Archive extends Widget<Model, Props> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  componentDidMount() {
    // TODO: extract this
    ArchiveManager.register(this.props.url, doc => {
      this.setState({ doc })
    })
  }

  componentWillUnmount() {
    ArchiveManager.unregister(this.props.url)
  }

  show({ docs }: Model) {
    const { selected = [], onTap = () => {} } = this.props

    return (
      <div style={style.Archive}>
        <div style={style.Items}>
          {docs.map(({ url }) => (
            <ArchiveItem
              url={url}
              isSelected={selected.includes(url)}
              onTap={onTap}
            />
          ))}
        </div>
      </div>
    )
  }
}

const style = {
  Archive: {
    backgroundColor: "rgba(97, 101, 117, 0.9)",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, 200px)",
    gridAutoRows: "200px",
    gridGap: "10px",
    width: "100%",
    color: "#333",
    padding: 40,
  },
}

Content.register("Archive", Archive)
