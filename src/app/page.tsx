'use client';

import React, { useState } from 'react';
import { AudioProvider } from '../utils/AudioContext';
import Keyboard from '../components/Keyboard';
import ScaleBrowser from '../components/ScaleBrowser';
import ChordVisualizer from '../components/ChordVisualizer';

export default function Home() {
  const [highlightedNotes, setHighlightedNotes] = useState<Set<number>>(new Set());
  const [selectedChord, setSelectedChord] = useState<{
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null>(null);
  const [selectedScale, setSelectedScale] = useState<{
    name: string;
    degrees: number[];
  } | null>(null);

  // Handle chord selection from ScaleBrowser
  const handleChordSelect = (chord: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null) => {
    setSelectedChord(chord);
  };

  // Handle scale selection from ScaleBrowser
  const handleScaleSelect = (scale: {
    name: string;
    degrees: number[];
  } | null) => {
    setSelectedScale(scale);
  };

  return (
    <AudioProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-48">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-3xl font-bold text-indigo-700">31-EDO Explorer</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Explore microtonal music with this interactive 31-tone equal temperament tool
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-4">
          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Scale Browser - Takes up 2/3 of the width on large screens */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Scale Browser</h2>
                  <ScaleBrowser 
                    onHighlightNotes={setHighlightedNotes} 
                    onChordSelect={handleChordSelect}
                    onScaleSelect={handleScaleSelect}
                  />
                </div>
              </div>
            </div>
            
            {/* Chord Visualizer - Takes up 1/3 of the width on large screens */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Interval Visualizer</h2>
                  <ChordVisualizer selectedChord={selectedChord} />
                </div>
              </div>
              
              {/* Current Chord Info - Visible on desktop and mobile */}
              {selectedChord && (
                <div className="mt-4 bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Current Chord</h2>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold text-indigo-700">{selectedChord.degreeRoman}</div>
                      <div className="text-lg text-gray-700">{selectedChord.type}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="mb-1"><span className="font-medium">Notes:</span> {selectedChord.notes.map(note => note).join(', ')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Fixed Keyboard at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Interactive Keyboard</h2>
              {selectedScale && (
                <div className="text-sm text-indigo-700 font-medium">
                  Current Scale: {selectedScale.name}
                </div>
              )}
              {selectedChord && (
                <div className="text-sm bg-indigo-100 px-3 py-1 rounded-full text-indigo-700 font-medium">
                  {selectedChord.degreeRoman} {selectedChord.type}
                </div>
              )}
            </div>
            <Keyboard 
              highlightedNotes={highlightedNotes} 
              selectedScale={selectedScale} 
            />
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <div>Use computer keyboard (Q-], A-\, Z-/) to play notes. Hold <span className="font-bold">Shift</span> for higher octave.</div>
              {selectedChord && (
                <div className="bg-gray-100 px-2 py-1 rounded">
                  Playing: {selectedChord.notes.length} notes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AudioProvider>
  );
} 