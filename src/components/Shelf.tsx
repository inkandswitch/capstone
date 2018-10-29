import * as React from "react"
import { Subscription } from "rxjs"
import * as css from "./css/Shelf.css"
import Movable from "./Movable"

const MAX_HEIGHT = 600

interface Props {
  children: React.ReactNode
}

interface State {
  offset: number
}

export default class Shelf extends React.Component<Props, State> {
  subscription?: Subscription
  isDragging = false

  render() {
    const { children } = this.props

    return (
      <Movable position={{ x: 0, y: -200 }} map={mapPosition}>
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
}

const mapPosition = ({ x, y }: Point) => {
  return { x, y: Math.min(0, Math.max(-MAX_HEIGHT, y)) }
}
