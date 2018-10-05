import * as React from "react"
import * as css from "./css/Card.css"

export const CARD_WIDTH = 398

export interface Props {
  cardId: string
}

export default class Card extends React.Component<Props> {
  render() {
    const { cardId, children, ...rest } = this.props
    return (
      <div className={css.Card} id={cardId} {...rest}>
        {children}
      </div>
    )
  }
}
