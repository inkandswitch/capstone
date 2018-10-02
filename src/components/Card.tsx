import * as Preact from "preact"
import * as css from "./css/Card.css"

export const CARD_WIDTH = 398

export interface Props {
  cardId: string
  exiting: boolean
  onExited: () => void
}

export default class Card extends Preact.Component<Props> {
  render() {
    const { cardId, exiting, children, ...rest } = this.props
    return (
      <div
        onTransitionEnd={this.props.onExited}
        className={exiting ? `${css.Card} ${css.Exiting}` : css.Card}
        id={cardId}
        {...rest}>
        {children}
      </div>
    )
  }
}
