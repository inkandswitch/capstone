import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { isEmpty, size } from "lodash"
import * as Widget from "./Widget"
import Mirrorable from "./Mirrorable"
import InteractableCard, { CardModel } from "./InteractableCard"
import Content, {
  DocumentActor,
  Message,
  ReceiveDocuments,
  DocumentCreated,
} from "./Content"
import * as Reify from "../data/Reify"
import * as UUID from "../data/UUID"
import { EditDoc, AnyDoc } from "automerge/frontend"
import * as Position from "../logic/Position"
import Ink, { InkStroke } from "./Ink"
import * as Img from "./Image"
import { AddToShelf, ShelfContents, ShelfContentsRequested } from "./Shelf"
import * as Link from "../data/Link"
import * as Utils from "../logic/SizeUtils"
import { resolve } from "path"

const boardIcon = require("../assets/board_icon.svg")

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: InkStroke[]
  topZ: number
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  onNavigate?: (url: string) => void
}

interface State {
  focusedCardId: string | null
}

export interface CreateCard extends Message {
  type: "CreateCard"
  body: {
    type: string
    card: {
      id: string
      x: number
      y: number
      width: number
      height: number
    }
  }
}

type WidgetMessage = CreateCard | ShelfContentsRequested | AddToShelf
type InMessage = WidgetMessage | ShelfContents | ReceiveDocuments
type OutMessage = DocumentCreated | AddToShelf | ShelfContentsRequested

export class BoardActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        const { urls } = message.body
        this.change(doc => {
          urls.forEach(url => {
            makeCard(doc, url).then(card => {
              this.change(doc => {
                doc.cards[card.id] = card
                return doc
              })
            })
          })
        })
        break
      }
      case "CreateCard": {
        const { type, card } = message.body
        // TODO: async creation - should we split this across multiple messages?
        const url = await this.create(type)
        this.change(doc => {
          const z = ++doc.topZ
          doc.cards[card.id] = { ...card, z, url }
          return doc
        })
        this.emit({ type: "DocumentCreated", body: url })
        break
      }
      case "AddToShelf": {
        this.emit({ type: "AddToShelf", body: message.body })
        break
      }
      case "ShelfContentsRequested": {
        this.emit({ type: "ShelfContentsRequested", body: message.body })
        break
      }
      case "ShelfContents": {
        const { urls, placementPosition } = message.body
        this.change(doc => {
          urls.forEach((url, index) => {
            makeCard(doc, url, Position.radial(index, placementPosition)).then(
              card => {
                this.change(doc => {
                  doc.cards[card.id] = card
                  return doc
                })
              },
            )
          })
        })
      }
    }
  }
}

function makeCard(
  board: EditDoc<Model>,
  url: string,
  position?: Point,
): Promise<CardModel> {
  return new Promise((resolve, reject) => {
    getInitialSize(url).then((size: Size) => {
      position = position || { x: 0, y: 0 }
      const card = {
        id: UUID.create(),
        z: board.topZ++,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        url,
      }
      resolve(card)
    })
  })
}

function getInitialSize(url: string): Promise<Size> {
  return new Promise((resolve, reject) => {
    Content.open(url, (doc: AnyDoc) => {
      const type = Link.parse(url).type
      if (type === "Image") {
        const srcString = doc.src as string
        if (srcString) {
          Utils.loadImageSize(srcString).then(size => {
            resolve(Utils.resolvedCardSize(size))
          })
        } else {
          reject()
        }
      } else {
        reject()
      }
    })
  })
}

class Board extends React.Component<Props, State> {
  boardEl?: HTMLDivElement
  state = { focusedCardId: null }

  static reify(doc: AnyDoc): Model {
    return {
      cards: Reify.map(doc.cards),
      strokes: Reify.array(doc.strokes),
      topZ: Reify.number(doc.topZ),
    }
  }

  onRef = (ref: HTMLDivElement) => {
    this.boardEl = ref
  }

  onDragStart = (id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return doc
      if (card.z === doc.topZ) return doc

      doc.topZ += 1
      // XXX: Remove once backend/store handles object immutability.
      doc.cards[id] = { ...card, z: doc.topZ }
      return doc
    })
  }

  onDragStop = (x: number, y: number, id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (card) {
        // XXX: Remove once backend/store handles object immutability.
        doc.cards[id] = { ...card, x: x, y: y }
      }
      return doc
    })
  }

  onResizeStop = (newSize: Size, id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (card) {
        // XXX: Remove once backend/store handles object immutability.
        doc.cards[id] = {
          ...card,
          width: newSize.width,
          height: newSize.height,
        }
      }
      return doc
    })
  }

  onMirror = (id: string) => {
    if (!this.props.doc.cards[id]) return
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return doc
      card.z = doc.topZ++
      const mirror = Object.assign({}, card, {
        id: UUID.create(),
        z: card.z - 1,
      })
      doc.cards[mirror.id] = mirror
      return doc
    })
  }

  render() {
    const { cards, strokes } = this.props.doc
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <div style={style.Board} ref={this.onRef}>
            <Ink onInkStroke={this.onInkStroke} strokes={strokes} />
            <TransitionGroup>
              {Object.values(cards).map(card => {
                if (!card) return null

                return (
                  <CSSTransition
                    key={card.id}
                    classNames="Card"
                    enter={false}
                    timeout={{ exit: 1 }}>
                    <Mirrorable cardId={card.id} onMirror={this.onMirror}>
                      <InteractableCard
                        card={card}
                        onDragStart={this.onDragStart}
                        onDragStop={this.onDragStop}
                        onResizeStop={this.onResizeStop}>
                        <Content mode="embed" url={card.url} />
                      </InteractableCard>
                    </Mirrorable>
                  </CSSTransition>
                )
              })}
            </TransitionGroup>
          </div>
        )
      case "embed":
      case "preview":
        return (
          <div style={style.Preview.Board}>
            <img style={style.Preview.Icon} src={boardIcon} />
            <div style={style.Preview.TitleContainer}>
              <div style={style.Preview.Title}>Board</div>
              <div style={style.Preview.SubTitle}>
                {isEmpty(cards) ? "No" : size(cards)} items
              </div>
            </div>
          </div>
        )
    }
  }

  onInkStroke = (strokes: InkStroke[]) => {
    this.props.change(doc => {
      doc.strokes.push(...strokes)
      return doc
    })
  }
}

const style = {
  Board: {
    width: "100%",
    height: "100%",
    position: "absolute" as "absolute",
    zIndex: 0,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  FocusBackgroundOverlay: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    position: "absolute" as "absolute",
    backgroundColor: "#000",
    opacity: 0.15,
  },

  Preview: {
    Board: {
      display: "flex" as "flex",
      flexDirection: "row" as "row",
      justifyContent: "center",
      padding: "50px 25px",
      fontSize: 16,
      backgroundColor: "#fff",
    },
    Icon: {
      height: 50,
      width: 50,
    },
    TitleContainer: {
      display: "flex" as "flex",
      flexDirection: "column" as "column",
      justifyContent: "center",
      margin: "0 15px",
    },
    Title: {
      fontSize: 24,
      fontWeight: 500,
      lineHeight: "1.2em",
    },
    SubTitle: {
      fontSize: "smaller",
    },
  },
}

export default Widget.create("Board", Board, Board.reify, BoardActor)
