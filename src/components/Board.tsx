import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { isEmpty, size } from "lodash"
import * as Widget from "./Widget"
import DraggableCard, { CardModel } from "./DraggableCard"
import Content, {
  DocumentActor,
  Message,
  ReceiveDocuments,
  DocumentCreated,
} from "./Content"
import * as Reify from "../data/Reify"
import * as UUID from "../data/UUID"
import Ink from "./Ink"
import { EditDoc, AnyDoc } from "automerge/frontend"
import * as Position from "../logic/Position"
import StrokeRecognizer, { StrokeSettings, InkStrokeEvent } from "./StrokeRecognizer"
import { AddToShelf, ShelfContents, ShelfContentsRequested } from "./Shelf"

const boardIcon = require("../assets/board_icon.svg")

const BOARD_PADDING = 15

export interface CanvasStroke {
  settings: StrokeSettings
  path: string
}

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: CanvasStroke[]
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
          urls.forEach((url: string) => addCard(doc, url))
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
          urls.forEach((url, index) =>
            addCard(doc, url, Position.radial(index, placementPosition)),
          )
          return doc
        })
        break
      }
    }
  }
}

function addCard(
  board: EditDoc<Model>,
  url: string,
  position?: { x: number; y: number },
) {
  position = position || { x: 0, y: 0 }
  const card = {
    id: UUID.create(),
    z: board.topZ++,
    x: position.x,
    y: position.y,
    url,
  }
  board.cards[card.id] = card
  return board
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

  render() {
    console.log("render board")
    const { cards, topZ, strokes } = this.props.doc
    const { focusedCardId } = this.state
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <StrokeRecognizer>
          <div style={style.Board} ref={this.onRef}>
            <TransitionGroup>
              {Object.values(cards).map(card => {
                if (!card) return null

                return (
                  <CSSTransition
                    key={card.id}
                    classNames="Card"
                    enter={false}
                    timeout={{ exit: 1 }}>
                    <DraggableCard
                      card={card}
                      onDragStart={this.onDragStart}
                      onDragStop={this.onDragStop}>
                      <Content mode="embed" url={card.url} />
                    </DraggableCard>
                  </CSSTransition>
                )
              })}
            </TransitionGroup>
            <Ink strokes={strokes} />
          </div>
          </StrokeRecognizer>
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

  onInkStroke = (strokes: InkStrokeEvent[]) => {
    this.props.change(doc => {
      const canvasStrokes: CanvasStroke[] = strokes.map(
        (event: InkStrokeEvent) => {
          return {
            settings: event.settings,
            path: event.points
              .map(point => `${point.x}/${point.y}/${point.pressure}`)
              .join("|"),
          }
        },
      )
      doc.strokes.push(...canvasStrokes)
      return doc
    })
  }
}

const style = {
  Board: {
    width: "100%",
    height: "100%",
    padding: BOARD_PADDING,
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
