import React, { useState, useEffect } from 'react';
import { getStepNoteName } from '../utils/IntervalUtils';

interface CircleVisualizerProps {
  highlightedNotes?: Set<number>;
  selectedScale?: {
    name: string;
    degrees: number[];
  } | null;
  showScale: boolean;
}

const CircleVisualizer: React.FC<CircleVisualizerProps> = ({
  highlightedNotes,
  selectedScale,
  showScale
}) => {
  const [useCircleOfFifths, setUseCircleOfFifths] = useState(false);
  const [localHighlightedNotes, setLocalHighlightedNotes] = useState<Set<number>>(new Set());

  // Sync our local highlighted notes with the prop
  useEffect(() => {
    if (highlightedNotes && highlightedNotes.size > 0) {
      console.log('highlightedNotes', highlightedNotes);
      setLocalHighlightedNotes(new Set(Array.from(highlightedNotes).map(note => note === 31 ? 0 : note % 31)));
    } else {
      setLocalHighlightedNotes(new Set());
    }
  }, [highlightedNotes]);

  // Generate note positions based on the selected ordering
  const generateNotePositions = () => {
    const positions: { note: number; angle: number }[] = [];
    const totalNotes = 31;
    const radius = 150; // Radius of the circle in pixels

    if (useCircleOfFifths) {
      // Circle of fifths ordering (C, G, D, A, E, B, F#, C#, G#, D#, A#, F, Cb, Gb, Db, Ab, Eb, Bb, F, C)
      const circleOfFifthsOrder = [0, 18, 5, 23, 10, 28, 15, 2, 20, 7, 25, 12, 30, 17, 4, 22, 9, 27, 14, 1, 19, 6, 24, 11, 29, 16, 3, 21, 8, 26, 13];
      
      circleOfFifthsOrder.forEach((note, index) => {
        const angle = ((index * 2 * Math.PI) / totalNotes) - (Math.PI / 2);
        console.log('note', note, 'angle', angle);
        positions.push({ note, angle });
      });
    } else {
      // Sequential ordering (0-31)
      for (let i = 0; i <= 30; i++) {
        const angle = (i * 2 * Math.PI) / totalNotes;
        positions.push({ note: i, angle });
      }
    }

    return positions.map(({ note, angle }) => ({
      note,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle)
    }));
  };

  const notePositions = generateNotePositions();

  // Function to normalize a note to its position within the octave
  const normalizeNote = (note: number): number => {
    return ((note - 1) % 31) + 1;
  };

  return (
    <div className="bg-white rounded-xl p-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {useCircleOfFifths ? 'Circle of Fifths' : 'Sequential'}
          </span>
          <button
            onClick={() => setUseCircleOfFifths(!useCircleOfFifths)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              useCircleOfFifths ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useCircleOfFifths ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-square flex items-center justify-center">
        <div className="relative w-[300px] h-[300px]">
          {/* Draw the circle */}
          <div className="absolute inset-0 border-2 border-gray-200 rounded-full" />
          
          {/* Draw the notes */}
          {notePositions.map(({ note, x, y }) => {
            const normalizedNote = normalizeNote(note);
            const isHighlighted = localHighlightedNotes.has(note);
            const isScaleNote = selectedScale && showScale && 
              selectedScale.degrees.some(degree => (degree % 31) === (normalizedNote % 31));
            
            return (
              <div
                key={note}
                className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                  isHighlighted 
                    ? 'bg-green-500 text-white' 
                    : isScaleNote 
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                }`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}
              >
                <div className="text-xs font-medium">
                  {getStepNoteName(normalizedNote)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CircleVisualizer; 