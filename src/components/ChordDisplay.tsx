import React from 'react';
import { Chord } from '../types/scale';

interface ChordDisplayProps {
  triads: Chord[];
  sevenths: Chord[];
  selectedChord: Chord | null;
  useSeventhChords: boolean;
  setUseSeventhChords: (use: boolean) => void;
  currentInversion: number;
  setCurrentInversion: (inversion: number) => void;
  useAutoInversion: boolean;
  setUseAutoInversion: (use: boolean) => void;
  actualAutoInversion: number;
  onChordSelect: (chord: Chord | null) => void;
  onPlayChord: (chord: Chord) => void;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({
  triads,
  sevenths,
  selectedChord,
  useSeventhChords,
  setUseSeventhChords,
  currentInversion,
  setCurrentInversion,
  useAutoInversion,
  setUseAutoInversion,
  actualAutoInversion,
  onChordSelect,
  onPlayChord
}) => {
  const chords = useSeventhChords ? sevenths : triads;
  const maxInversion = useSeventhChords ? 3 : 2;
  
  // Function to handle chord selection and playing
  const handleChordClick = (chord: Chord) => {
    // Always play the chord when clicked
    onPlayChord(chord);
    
    // If it's not already selected, also select it
    if (!selectedChord || selectedChord.degree !== chord.degree || selectedChord.type !== chord.type) {
      onChordSelect(chord);
    }
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Chords</h3>
        <div className="flex items-center space-x-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              checked={useSeventhChords}
              onChange={(e) => setUseSeventhChords(e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-700">7th Chords</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              checked={useAutoInversion}
              onChange={(e) => setUseAutoInversion(e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-700">Auto Inversion</span>
          </label>
        </div>
      </div>
      
      {/* Keyboard Shortcuts Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        <h4 className="font-medium mb-1">Keyboard Shortcuts:</h4>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Press <span className="font-mono bg-blue-100 px-1 rounded">1</span> - <span className="font-mono bg-blue-100 px-1 rounded">7</span> to play chords</li>
          <li>
            Inversions: 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">8</span> (root), 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">9</span> (1st), 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">0</span> (2nd), 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">-</span> (3rd), 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">=</span> or <span className="font-mono bg-blue-100 px-1 rounded">a</span> (auto)
          </li>
        </ul>
      </div>
      
      {/* Inversion Controls */}
      {!useAutoInversion && (
        <div className="mb-4 flex items-center space-x-2">
          <span className="text-sm text-gray-700">Inversion:</span>
          <div className="flex space-x-1">
            {Array.from({ length: maxInversion + 1 }).map((_, i) => (
              <button
                key={i}
                className={`px-2 py-1 text-xs rounded ${
                  currentInversion === i
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setCurrentInversion(i);
                  // Play the selected chord with the new inversion if one is selected
                  if (selectedChord) {
                    onPlayChord(selectedChord);
                  }
                }}
              >
                {i === 0 ? 'Root' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : 'rd'}`}
                <span className="ml-1 text-xs opacity-60">{i === 0 ? '(8)' : i === 1 ? '(9)' : i === 2 ? '(0)' : '(-)'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Chord Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {chords.map((chord, index) => (
          <button
            key={index}
            className={`p-2 rounded text-left transition-all ${
              selectedChord && selectedChord.degree === chord.degree && selectedChord.type === chord.type
                ? 'bg-indigo-100 border border-indigo-300 shadow-sm'
                : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => handleChordClick(chord)}
          >
            <div className="font-medium text-sm text-gray-800">
              {chord.degreeRoman}
              <span className="ml-1 text-xs text-gray-500">({index + 1})</span>
            </div>
            <div className="text-xs text-gray-600">{chord.type}</div>
          </button>
        ))}
      </div>
      
      {/* Selected Chord Info */}
      {selectedChord && (
        <div className="mt-4 bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <div>
            <h4 className="text-sm font-medium text-gray-800">
              {selectedChord.degreeRoman} {selectedChord.type}
            </h4>
            <p className="text-xs text-gray-600">Function: {selectedChord.function}</p>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-700">
              <span className="font-medium">Notes:</span> {selectedChord.notes.join(', ')}
            </p>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Intervals:</span> {selectedChord.intervals.join(', ')}
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-500 italic">
            Click the chord again or press its number key to replay it
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordDisplay; 