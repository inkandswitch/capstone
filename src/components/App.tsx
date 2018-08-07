import * as Preact from "preact"

import * as Types from "../types"
import Board from "./Board"
import Archive from "./Archive"
import { BOARD_WIDTH, WINDOW_HEIGHT } from "../constants"
import Card from "./Card"
import { assoc, random } from "lodash/fp"

interface Cards {
  [s: string]: Types.Card
}
interface State {
  cards: Cards
  highestBoardZ: number
  mouseX: number
  mouseY: number
}

export interface Props {}

const sampleTexts = [
  "Leonardo da Vinci was a proto-scientist with his mix of empiricism and reasoning by analogy",
  "Historical hindsight suggests his greatest talent was as a painter but he considered himself as much a military engineer and sculptor",
  "Studies of human and animal anatomy, often via dissection, lead to the most realistic poses and musculature of the day",
  "Misconception around his flying machines and other fantastical devices most likely designed for theather performances, not the real world",
]

// TODO: why doesn't `require("...")` work here anymore?
const sampleImages = [
  "../assets/leonardo_polyhedra.png",
  "../assets/leonardo_anatomy.jpg",
  "../assets/leonardo_hoist.jpg",
]

const sampleCards = 50
const sampleProbImage = 0.2

export default class App extends Preact.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    let cards: Cards = {}
    for (let i = 0; i < sampleCards; i++) {
      const x = random(0, BOARD_WIDTH - 150)
      const y = random(0, WINDOW_HEIGHT - 100)
      const id = "c" + i
      const imageCard = Math.random() < sampleProbImage

      cards[id] = {
        isBeingDraggedFromArchive: false,
        id: id,
        x: x,
        y: y,
        z: i,
        onBoard: true,
        image: imageCard
          ? sampleImages[Math.floor(Math.random() * sampleImages.length)]
          : null,
        text: imageCard
          ? null
          : sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
      }
    }
    this.state = {
      cards: cards,
      highestBoardZ: sampleCards - 1,
      mouseX: 0,
      mouseY: 0,
    }
  }

  liftBoardCardZ = (card: Types.Card) => {
    const highestBoardZ = this.state.highestBoardZ + 1

    this.setState(assoc(["cards", card.id, "z"], highestBoardZ))

    this.setState({ highestBoardZ })
  }

  mouseDownArchiveCard = (card: Types.Card) => {
    const newHighestBoardZ = 1
    const newCard = Object.assign({}, card, {
      z: newHighestBoardZ,
      isBeingDraggedFromArchive: true,
    })
    const newCards = Object.assign({}, this.state.cards, { [card.id]: newCard })
    const newState = Object.assign({}, this.state, {
      highestBoardZ: newHighestBoardZ,
      cards: newCards,
    })
    this.setState(newState)
  }

  render() {
    let optionalDiv = null
    Object.keys(this.state.cards).map((id: string) => {
      const card = this.state.cards[id]
      if (card.isBeingDraggedFromArchive) {
        optionalDiv = (
          <div
            style={{
              zIndex: card.z,
              top: this.state.mouseY,
              left: this.state.mouseX,
              position: "absolute",
            }}>
            <Card text={card.text} image={card.image} z={card.z} />
          </div>
        )
      }
    })
    return (
      <div
        className="App"
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}>
        <Board cards={this.state.cards} liftBoardCardZ={this.liftBoardCardZ} />
        <Archive
          cards={this.state.cards}
          mouseDownArchiveCard={this.mouseDownArchiveCard}
        />
        {optionalDiv}
      </div>
    )
  }

  onMouseMove = (e: MouseEvent) => {
    const newState = Object.assign({}, this.state, {
      mouseX: e.clientX,
      mouseY: e.clientY,
    })
    this.setState(newState)
  }

  onMouseUp = (e: MouseEvent) => {
    const newCards = Object.assign({}, this.state.cards)

    Object.keys(this.state.cards).map((id: string) => {
      const card = this.state.cards[id]
      if (card.isBeingDraggedFromArchive) {
        const newCard = Object.assign({}, card, {
          x: this.state.mouseX,
          y: this.state.mouseY,
          z: 1,
          onBoard: true,
          isBeingDraggedFromArchives: false,
        })
        newCards[card.id] = newCard
      }
    })
    const newState = Object.assign({}, this.state, {
      cards: newCards,
      mouseX: e.clientX,
      mouseY: e.clientY,
    })
    this.setState(newState)
  }
}
