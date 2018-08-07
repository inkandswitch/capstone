import * as Preact from "preact"
import Draggable from "../draggable/index"
import * as Types from "../types"
import Card from "./Card"

export interface Props {
  card: Types.Card
  onDragStart: (card: Types.Card) => void
}

export default class DraggableCard extends Preact.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return (this.props.card !== nextProps.card)
  }

  render() {
    const { card } = this.props

    return (
      <Draggable
        key={card.id}
        defaultPosition={{ x: card.x, y: card.y }}
        onStart={() => this.props.onDragStart(card)}
        z={card.z}>
        <Card text={card.text} image={card.image} />
      </Draggable>
    )
  }
}
