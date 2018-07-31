import * as React from 'react';
import Draggable from 'react-draggable';

import * as Types from '../types';

interface BoardProps {
  cards: { [s: string]: Types.Card };
  liftBoardCardZ: (card: Types.Card) => void;
}

export default class Board extends React.PureComponent<BoardProps, any> {
  constructor(props: BoardProps) {
    super(props);
    const numberOfCards = Object.keys(props.cards).length;
    this.state = {highestZ: numberOfCards};
  }

  render() {
    return (
      <div style={boardStyle} className='board'>
        {Object.keys(this.props.cards).map((id: string) => {
          const card = this.props.cards[id];
          if (!card.onBoard) {
            return null;
          }
          return (
            <Draggable
              key={card.id}
              defaultPosition={{x: card.x, y: card.y}}
              onStart={() => this.props.liftBoardCardZ(card)}>
              <div
                className='card'
                style={Object.assign({}, Types.cardStyle, {zIndex: card.z})}>
                {card.image ? <img src={card.image} style={Types.cardImageStyle} /> : card.text}
              </div>
            </Draggable>
          );
      })}
      </div>
    );
  }
}

const boardStyle = {
  width: 800,
  height: 400,
};

