import * as React from 'react';

import { Card } from '../types';
import { WINDOW_HEIGHT, ARCHIVE_WIDTH } from '../constants';

interface ArchiveProps {
  cards: { [s: string]: Card; } ;
  mouseDownArchiveCard: (card: Card) => void;
}

export default class Archive extends React.PureComponent<ArchiveProps, any> {
  render() {
    return (
      <div style={archiveStyle} className='archive'>
        <ul style={ {padding: 0} }>
          {Object.keys(this.props.cards).sort().map((id: string) => {
            const card = this.props.cards[id];
            return (
              <li
                key={card.id}
                style={summaryCardStyle}
                className='summaryCards'
                onMouseDown={() => this.props.mouseDownArchiveCard(card)}
                >
                {card.image ? <img src={card.image} style={summaryCardImageStyle} /> : card.text}
              </li>
            );
        })}
        </ul>
      </div>
    );
  }
}

const archiveStyle = {
  position: 'absolute',
  right: 0,
  top: 0,
  width: ARCHIVE_WIDTH,
  minHeight: WINDOW_HEIGHT,
  maxHeight: WINDOW_HEIGHT,
  zIndex: 50000000,
  background: '#42444d',
  overflowY: 'scroll',
  overflowX: 'hidden',
};

const summaryCardStyle = {
  background: '#4d4f57',
  borderRadius: '4px',
  listStyleType: 'none',
  margin: 16,
  padding: 8,
  textIndent: 0,
  width: ARCHIVE_WIDTH - 48,
  height: 60,
  color: '#bbbcbd',
  fontSize: 12,
  overflow: 'hidden',
};

const summaryCardImageStyle = {
  height: '90%',
  pointerEvents: 'none',
};
