import * as React from "react"
import Draggable from "./Draggable"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { omit } from "lodash"

export interface CardModel {
  id: string
  x: number
  y: number
  z: number
  url: string
}

export interface Props {
  card: CardModel
  onDragStart: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onDoubleTap?: (url: string) => void
}

export default class DraggableCard extends React.Component<Props> {
  start = () => {
    this.props.onDragStart(this.props.card.id)
  }

  stop = (x: number, y: number) => {
    this.props.onDragStop && this.props.onDragStop(x, y, this.props.card.id)
  }

  cancel = (data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
  }

  render() {
    const {
      card: { x, y, z },
      children,
      ...rest
    } = this.props

    return (
      <Draggable
        position={{ x, y }}
        onStart={this.start}
        onStop={this.stop}
        z={z}>
        <Card
          cardId={this.props.card.id}
          {...omit(rest, ["onDoubleTap", "onDragStop"])}>
          {children}
        </Card>
      </Draggable>
    )
  }
}
