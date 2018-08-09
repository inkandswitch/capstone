import * as Preact from "preact"
import Draggable from "../draggable/index"
import Card from "./Card"

interface CardModel {
  x: number
  y: number
  z: number
  type: string
  id: string
}

export interface Props {
  card: CardModel
  onDragStart: (id: string) => void
}

export default class DraggableCard extends Preact.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.card !== nextProps.card
  }

  render() {
    const { card } = this.props

    return (
      <Draggable
        key={card.id}
        defaultPosition={{ x: card.x, y: card.y }}
        onStart={this.start}
        z={card.z}>
        <Card type={card.type} id={card.id} />
      </Draggable>
    )
  }

  start = () => {
    this.props.onDragStart(this.props.card.id)
  }
}
