import * as React from "react"
import * as css from "./Card.css"

export const CARD_WIDTH = 398

export interface Props {
  cardId: string
  [k: string]: unknown
}

export default class Card extends React.Component<Props> {
  render() {
    const { cardId, children, ...rest } = this.props
    return (
      <div className={css.Card + " Card"} id={cardId} {...rest}>
        {children}
      </div>
    )
  }
}
