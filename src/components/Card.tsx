import * as Preact from "preact"

export const CARD_WIDTH = 398
export const CARD_CLASS = "Card"

export interface Props {
  cardId: string
}

export default class Card extends Preact.Component<Props> {
  render() {
    const { cardId, children, ...rest } = this.props
    return (
      <div className={CARD_CLASS} style={style.Card} id={cardId} {...rest}>
        {children}
      </div>
    )
  }
}

const style = {
  Card: {
    width: CARD_WIDTH,
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "white",
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid #E8E8E8",
    display: "grid",
    gridTemplateRows: "auto",
    gridTemplateColumns: "auto",
  },
}
