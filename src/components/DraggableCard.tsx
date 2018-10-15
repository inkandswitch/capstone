import * as React from "react"
import Interactable from "./Interactable"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { omit } from "lodash"

export interface CardModel {
  id: string
  x: number
  y: number
  z: number
  width: number
  height: number
  url: string
}

export interface Props {
  card: CardModel
  onDragStart: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onResizeStop?: (scaleFactor: number, id: string) => void
  onDoubleTap?: (url: string) => void
}

export default class DraggableCard extends React.Component<Props> {
  start = () => {
    this.props.onDragStart(this.props.card.id)
  }

  dragStop = (x: number, y: number) => {
    this.props.onDragStop && this.props.onDragStop(x, y, this.props.card.id)
  }

  resizeStop = (scaleFactor: number) => {
    this.props.onResizeStop &&
      this.props.onResizeStop(scaleFactor, this.props.card.id)
  }

  cancel = (data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
    this.props.onResizeStop &&
      this.props.onResizeStop(
        1.0, //TODO
        this.props.card.id,
      )
  }

  render() {
    const {
      card: { x, y, width, height, z },
      children,
      ...rest
    } = this.props

    return (
      <Interactable
        position={{ x, y }}
        size={{ width, height }}
        onStart={this.start}
        onDragStop={this.dragStop}
        onResizeStop={this.resizeStop}
        z={z}>
        <Card
          cardId={this.props.card.id}
          style={{ width: width, height: height }}
          {...omit(rest, ["onDoubleTap", "onDragStop", "onResizeStop"])}>
          {children}
        </Card>
      </Interactable>
    )
  }
}
