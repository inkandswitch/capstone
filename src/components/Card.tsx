import * as Preact from "preact"

export interface Props {
  image?: string
  text?: string
}

export default class Card extends Preact.Component<Props> {

  // TODO: We'll need to update this when we expect other props.
  // We basically want fast shallow compare of props & nextProps.
  shouldComponentUpdate(nextProps: Props) {
    return (this.props.image !== nextProps.image) ||
           (this.props.text !== nextProps.text)
  }

  render() {
    const { image, text, ...rest } = this.props
    return (
      <div className="Card" style={style.card} {...rest}>
        {image ? <img src={image} style={style.image} /> : text}
      </div>
    )
  }
}

const style = {
  card: {
    height: 90,
    width: 150,
    padding: 12,
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "white",
    border: "1px solid #f0f0f0",
    borderRadius: 6,
    boxShadow: "0px 6px 12px -8px rgba(0,0,0,0.1)",
  },
  image: {
    height: "90%",
    pointerEvents: "none",
  },
}
