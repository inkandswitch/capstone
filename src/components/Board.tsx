import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { isEmpty, size } from "lodash"
import * as Widget from "./Widget"
import Mirrorable from "./Mirrorable"
import InteractableCard, { CardModel } from "./InteractableCard"
import EdgeBoardCreator from "./EdgeBoardCreator"
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
import { AddToShelf, ShelfContents, ShelfContentsRequested } from "./Shelf"
import * as Link from "../data/Link"
import * as SizeUtils from "../logic/SizeUtils"
import { resolve } from "path"
import * as css from "./css/Board.css"

const boardIcon = require("../assets/board_icon.svg")

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: InkStroke[]
  topZ: number
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  onNavigate?: (url: string) => void
}

interface State {}

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

const BOARD_CREATE_TARGET_SIZE = 20

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
            makeCard(url, doc.topZ++).then(card => {
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
            makeCard(
              url,
              doc.topZ++,
              Position.radial(index, placementPosition),
            ).then(card => {
              this.change(doc => {
                doc.cards[card.id] = card
                return doc
              })
            })
          })
        })
        break
      }
    }
  }
}

function makeCard(
  url: string,
  zIndex: number,
  position?: Point,
): Promise<CardModel> {
  return new Promise((resolve, reject) => {
    Content.open(url, doc => {
      SizeUtils.calculateInitialSize(url, doc).then((size: Size) => {
        position = position || { x: 0, y: 0 }
        const card = {
          id: UUID.create(),
          z: zIndex,
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
          url,
        }
        resolve(card)
      })
    })
  })
}

class Board extends React.Component<Props, State> {
  boardEl?: HTMLDivElement
  state: State = {}

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

  onCreateBoard = (position: Point) => {
    const url = Content.create("Board")
    let { topZ } = this.props.doc
    makeCard(url, topZ++, position).then(card => {
      this.props.change(doc => {
        doc.cards[card.id] = card
        return doc
      })
    })
  }

  render() {
    const { cards, strokes, topZ } = this.props.doc
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <div className={css.Board} ref={this.onRef}>
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
                        onPinchOutEnd={this.props.onNavigate}
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
            <EdgeBoardCreator
              onBoardCreate={this.onCreateBoard}
              zIndex={topZ + 1}
            />
          </div>
        )

      case "embed":
      case "preview":
        return (
          <div className={css.BoardPreview}>
            <img className={css.Icon} src={boardIcon} />
            <div className={css.TitleContainer}>
              <div className={css.Title}>Board</div>
              <div className={css.SubTitle}>
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

export default Widget.create("Board", Board, Board.reify, BoardActor)
