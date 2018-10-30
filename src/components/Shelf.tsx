import * as React from "react"
import { Subscription } from "rxjs"
import * as css from "./css/Shelf.css"
import Movable from "./Movable"
import { clamp } from "lodash"

const MAX_HEIGHT = 600

interface Props {
  children: React.ReactNode
  offset: number
  onResize: (position: Point) => void
}

export default class Shelf extends React.Component<Props> {
  subscription?: Subscription
  isDragging = false

  render() {
    const { children, offset } = this.props

    return (
      <Movable
        position={{ x: 0, y: offset }}
        map={mapPosition}
        onMoveEnd={this.onMoveEnd}>
        {(ref, { position: { y } }) => (
          <div ref={ref} className={css.Wrapper}>
            <div className={css.FixedTab} />
            <div
              className={css.Tab}
              style={{ transform: `translateY(${y}px)` }}
            />
            <div
              style={{ transform: `translateY(${y}px)` }}
              className={css.Shelf}>
              {children}
            </div>
          </div>
        )}
      </Movable>
    )
  }

  onMoveEnd = (position: Point) => {
    this.props.onResize(position)
  }
}

const mapPosition = ({ x, y }: Point) => {
  const clampedY = clamp(y, -MAX_HEIGHT, 0)
  return { x, y: clampedY }
}
