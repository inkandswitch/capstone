import * as React from "react"
import { Subscription } from "rxjs"
import * as RxOps from "rxjs/operators"
import * as css from "./css/Shelf.css"
import * as GPS from "../logic/GPS"
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
  state: State = { offset: 0 }
  isDragging = false

  render() {
    const { children } = this.props
    return (
      <Movable map={mapPosition}>
        {(ref, { position: { y } }) => (
          <div ref={ref} className={css.Wrapper}>
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
