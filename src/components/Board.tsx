import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { isEmpty, size, noop } from "lodash"
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
import * as SizeUtils from "../logic/SizeUtils"
import * as css from "./css/Board.css"

const withAvailableWidth = require("react-with-available-width")
const boardIcon = require("../assets/board_icon.svg")

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: InkStroke[]
  topZ: number
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  availableWidth: number
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
        urls.forEach(async url => {
          const size = await getCardSize(url)
          this.change(doc => addCard(url, doc, size))
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
        urls.forEach(async (url, index) => {
          const size = await getCardSize(url)
          this.change(doc =>
            addCard(url, doc, size, Position.radial(index, placementPosition)),
          )
        })
        break
      }
    }
  }
}

function getCardSize(url: string): Promise<Size> {
  return new Promise((resolve, reject) => {
    Content.open(url, doc => {
      SizeUtils.calculateInitialSize(url, doc).then((size: Size) => {
        resolve(size)
      })
    })
  })
}

function addCard(
  url: string,
  board: EditDoc<Model>,
  size: Size,
  position?: Point,
) {
  const z = ++board.topZ
  position = position || { x: 0, y: 0 }
  const card = {
    id: UUID.create(),
    z: z,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    url,
  }
  board.cards[card.id] = card
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
      if (!card) return
      if (card.z === doc.topZ) return

      card.z = ++doc.topZ
    })
  }

  onDragStop = (x: number, y: number, id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return
      card.x = x
      card.y = y
    })
  }

  onResizeStop = (newSize: Size, id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return

      card.width = newSize.width
      card.height = newSize.height
    })
  }

  onMirror = (id: string) => {
    if (!this.props.doc.cards[id]) return
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return

      card.z = ++doc.topZ

      const mirror = {
        ...card,
        id: UUID.create(),
        z: card.z - 1,
      }
      doc.cards[mirror.id] = mirror
    })
  }

  onCreateBoard = (position: Point) => {
    const url = Content.create("Board")
    this.props.change(doc => {
      addCard(url, doc, { width: 300, height: 200 }, position)
    })
  }

  render() {
    const { cards, strokes, topZ } = this.props.doc
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <div className={css.Board} ref={this.onRef}>
            <Ink
              onInkStroke={this.onInkStroke}
              strokes={strokes}
              mode={this.props.mode}
            />
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
        const scale = this.props.availableWidth / 1200
        const style = {
          transform: `scale(${scale},${scale})`,
          willChange: "transform",
          transformOrigin: "top left",
        }

        return (
          <div className={css.BoardEmbed} ref={this.onRef}>
            <Ink
              onInkStroke={this.onInkStroke}
              strokes={strokes}
              mode={this.props.mode}
              scale={scale}
            />
            <div style={style}>
              {Object.values(cards).map(card => {
                if (!card) return null
                return (
                  <InteractableCard
                    key={card.id}
                    card={card}
                    onPinchOutEnd={noop}
                    onDragStart={noop}
                    onDragStop={noop}
                    onResizeStop={noop}>
                    <Content mode="preview" url={card.url} />
                  </InteractableCard>
                )
              })}
            </div>
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                position: "absolute",
              }}
            />
          </div>
        )
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
    })
  }
}

export default Widget.create(
  "Board",
  withAvailableWidth(Board),
  Board.reify,
  BoardActor,
)
