import * as Preact from "preact"

export const CARD_WIDTH = 398
export const CARD_HEIGHT = 398

export default class Card extends Preact.Component {
  render() {
    const { children, ...rest } = this.props
    return (
      <div style={style.Card} {...rest}>
        {children}
      </div>
    )
  }
}

const style = {
  Card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
