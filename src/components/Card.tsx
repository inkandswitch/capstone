import * as Preact from "preact"

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
    width: 320,
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "white",
    borderRadius: 6,
    overflow: "hidden",
    boxShadow: "0 0 12px -5px rgba(0,0,0,0.5)",
    display: "grid",
    gridTemplateRows: "auto",
    gridTemplateColumns: "auto",
  },
}
