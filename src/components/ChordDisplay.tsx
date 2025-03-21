import React from 'react';
import { Chord } from '../types/scale';

interface ChordDisplayProps {
  triads: Chord[];
  sevenths: Chord[];
  traditionalTriads: Chord[];
  traditionalSevenths: Chord[];
  selectedChord: Chord | null;
  useSeventhChords: boolean;
  setUseSeventhChords: (use: boolean) => void;
  currentInversion: number;
  setCurrentInversion: (inversion: number) => void;
  useAutoInversion: boolean;
  setUseAutoInversion: (use: boolean) => void;
  onChordSelect: (chord: Chord | null) => void;
  onPlayChord: (chord: Chord) => void;
  stopAllNotes: () => void;
  useTraditionalChords: boolean;
  setUseTraditionalChords: (use: boolean) => void;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({
  triads,
  sevenths,
  traditionalTriads,
  traditionalSevenths,
  selectedChord,
  useSeventhChords,
  setUseSeventhChords,
  currentInversion,
  setCurrentInversion,
  useAutoInversion,
  setUseAutoInversion,
  onChordSelect,
  onPlayChord,
  stopAllNotes,
  useTraditionalChords,
  setUseTraditionalChords,
}) => {
  const sophisticatedChords = useSeventhChords ? sevenths : triads;
  const traditionalChords = useSeventhChords ? traditionalSevenths : traditionalTriads;
  const maxInversion = useSeventhChords ? 3 : 2;
  
  // Add mouse events to handle stopping sounds on mouse up
  const handleChordMouseDown = (chord: Chord) => {
    // Play the chord
    onPlayChord(chord);
    
    // If it's not already selected, also select it
    if (!selectedChord || selectedChord.degree !== chord.degree || selectedChord.type !== chord.type) {
      onChordSelect(chord);
    }
  };
  
  const handleChordMouseUp = () => {
    // Stop all notes with a slight release time for natural decay
    stopAllNotes();
  };
  
  const handleChordMouseLeave = () => {
    // Stop notes if mouse leaves the chord button while held down
    stopAllNotes();
  };
  
  return (
    <div className="p-3">
      {/* Header with Options */}
      <div className="flex flex-col space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Scale Chords</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseSeventhChords(!useSeventhChords)}
              className={`px-2.5 py-1 text-sm rounded-md transition-colors ${
                useSeventhChords 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7th Chords
            </button>
            <button
              onClick={() => setUseAutoInversion(!useAutoInversion)}
              className={`px-2.5 py-1 text-sm rounded-md transition-colors ${
                useAutoInversion 
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Auto-Invert
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts - More Compact */}
        <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
          <div className="flex items-center gap-2">
            <span className="font-medium">Chords:</span>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Inversions:</span>
            <div className="flex gap-1">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">8-0</span>
              {useSeventhChords && (
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">-</span>
              )}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">=</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inversion Controls - if not auto */}
      {!useAutoInversion && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: maxInversion + 1 }).map((_, i) => (
                <button
                  key={i}
                  className={`px-2.5 py-1 text-sm rounded-md transition-colors ${
                    currentInversion === i
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onMouseDown={() => {
                    setCurrentInversion(i);
                    if (selectedChord) onPlayChord(selectedChord);
                  }}
                  onMouseUp={handleChordMouseUp}
                  onMouseLeave={handleChordMouseLeave}
                  onTouchStart={() => {
                    setCurrentInversion(i);
                    if (selectedChord) onPlayChord(selectedChord);
                  }}
                  onTouchEnd={handleChordMouseUp}
                >
                  {i === 0 ? 'Root' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : 'rd'}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chord Grids */}
      <div className="space-y-4">
        {/* Traditional Chords (Now Primary) */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {traditionalChords.map((chord, index) => (
              <button
                key={`traditional-${index}`}
                className={`p-2.5 rounded-md text-left transition-all ${
                  selectedChord && selectedChord.degree === chord.degree && selectedChord.type === chord.type
                    ? 'bg-indigo-50 border-2 border-indigo-300'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
                onMouseDown={() => handleChordMouseDown(chord)}
                onMouseUp={handleChordMouseUp}
                onMouseLeave={handleChordMouseLeave}
                onTouchStart={() => handleChordMouseDown(chord)}
                onTouchEnd={handleChordMouseUp}
              >
                <div className="font-medium text-sm text-gray-800">
                  {chord.degreeRoman}
                  <span className="ml-1 text-xs text-gray-500">({index + 1})</span>
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{chord.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle for Intervallic Analysis */}
        <button
          onClick={() => setUseTraditionalChords(!useTraditionalChords)}
          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 flex justify-between items-center"
        >
          <span>Show intervallic analysis alternatives</span>
          <svg 
            className={`w-4 h-4 transform transition-transform ${!useTraditionalChords ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Sophisticated Chords (Now Secondary) */}
        {!useTraditionalChords && (
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {sophisticatedChords.map((chord, index) => (
                <button
                  key={`sophisticated-${index}`}
                  className={`p-2.5 rounded-md text-left transition-all ${
                    selectedChord && selectedChord.degree === chord.degree && selectedChord.type === chord.type
                      ? 'bg-indigo-50 border-2 border-indigo-300'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                  onMouseDown={() => handleChordMouseDown(chord)}
                  onMouseUp={handleChordMouseUp}
                  onMouseLeave={handleChordMouseLeave}
                  onTouchStart={() => handleChordMouseDown(chord)}
                  onTouchEnd={handleChordMouseUp}
                >
                  <div className="font-medium text-sm text-gray-800">
                    {chord.degreeRoman}
                    <span className="ml-1 text-xs text-gray-500">({index + 1})</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{chord.type}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Chord Info - More Compact */}
      {selectedChord && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-md border border-indigo-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-indigo-900">
                {selectedChord.degreeRoman} {selectedChord.type}
              </h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                Notes: {selectedChord.notes.join(', ')} • 
                Intervals: {selectedChord.intervals.join(', ')}
              </p>
            </div>
            <button
              onClick={() => onPlayChord(selectedChord)}
              className="p-1.5 text-indigo-600 hover:text-indigo-700 transition-colors"
              title="Replay chord"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordDisplay; 