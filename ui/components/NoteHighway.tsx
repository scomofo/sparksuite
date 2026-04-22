import React from 'react';

interface Note {
  chord: string;
  time: number; // seconds
}

interface Props {
  notes: Note[];
  currentTime: number;
}

const NOTE_SPEED = 100; // pixels per second
const HIT_LINE_Y = 300;

export const NoteHighway: React.FC<Props> = ({ notes, currentTime }) => {
  return (
    <div style={{ position: 'relative', height: 400, background: '#111', overflow: 'hidden' }}>
      {/* Hit Line */}
      <div
        style={{
          position: 'absolute',
          top: HIT_LINE_Y,
          left: 0,
          right: 0,
          height: 2,
          background: 'white'
        }}
      />

      {/* Notes */}
      {notes.map((note, idx) => {
        const delta = note.time - currentTime;
        const y = HIT_LINE_Y - delta * NOTE_SPEED;

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: y,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 12px',
              background: '#333',
              color: 'white',
              borderRadius: 4
            }}
          >
            {note.chord}
          </div>
        );
      })}
    </div>
  );
};
