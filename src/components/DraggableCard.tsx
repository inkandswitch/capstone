import * as React from "react"
import Draggable from "../modules/draggable/index"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import Touch, { TouchEvent } from "./Touch"
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
}

export default class DraggableCard extends React.Component<Props> {
  render() {
    const {
      card: { x, y, z },
      children,
      ...rest
    } = this.props

    return (
      <Card
        cardId={this.props.card.id}
        {...omit(rest, ["onDoubleTap", "onDragStop"])}>
        {children}
      </Card>
    )
  }
}
