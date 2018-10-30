import * as React from "react"
import * as css from "./css/Card.css"
import { zoomableProps } from "./ZoomNav"

export const CARD_WIDTH = 398

export interface Props {
  cardId: string
  url: string
  [k: string]: unknown
}

export default class Card extends React.Component<Props> {
  render() {
    const { url, cardId, children, ...rest } = this.props
    return (
      <div
        className={css.Card + " Card"}
        id={cardId}
        {...rest}
        {...zoomableProps(url)}>
        {children}
      </div>
    )
  }
}
