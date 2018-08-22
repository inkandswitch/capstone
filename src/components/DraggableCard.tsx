import * as Preact from "preact"
import Draggable from "../draggable/index"
import Card from "./Card"

interface CardModel {
  x: number
  y: number
  z: number
}

export interface Props {
  card: CardModel
  index: number
  onDragStart: (idx: number) => void
  [propName: string]: any
}

export default class DraggableCard extends Preact.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.card !== nextProps.card
  }

  render() {
    const {
      card: { x, y, z },
      children,
      ...rest
    } = this.props

    return (
      <Draggable
        defaultPosition={{ x, y }}
        onStart={this.start}
        z={z}
        enableUserSelectHack={false}>
        <Card {...rest}>{children}</Card>
      </Draggable>
    )
  }

  start = () => {
    this.props.onDragStart(this.props.index)
  }
}
