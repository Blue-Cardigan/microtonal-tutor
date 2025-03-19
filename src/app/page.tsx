'use client';

import React, { useState, useCallback } from 'react';
import { AudioProvider } from '../utils/AudioContext';
import Keyboard from '../components/Keyboard';
import ScaleBrowser from '../components/ScaleBrowser';
import ChordVisualizer from '../components/ChordVisualizer';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Home() {
  // Use useCallback for state setters to prevent unnecessary re-renders
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
  const [showScale, setShowScale] = useState<boolean>(true);
  const [isKeyboardExpanded, setIsKeyboardExpanded] = useState<boolean>(true);

  // Memoize these handlers to prevent them from changing on every render
  const handleHighlightNotes = useCallback((notes: Set<number>) => {
    setHighlightedNotes(notes);
  }, []);

  const handleChordSelect = useCallback((chord: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null) => {
    setSelectedChord(chord);
  }, []);

  const handleScaleSelect = useCallback((scale: {
    name: string;
    degrees: number[];
  } | null) => {
    setSelectedScale(scale);
  }, []);

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
                    onHighlightNotes={handleHighlightNotes} 
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
            </div>
          </div>
        </main>

        {/* Fixed Keyboard at Bottom */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          isKeyboardExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'
        }`}>
          <div className="container mx-auto px-4 py-3">
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer"
              onClick={() => setIsKeyboardExpanded(!isKeyboardExpanded)}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">Interactive Keyboard</h2>
                {isKeyboardExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex items-center gap-4">
                {selectedScale && (
                  <>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Show scale</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent collapse toggle
                          setShowScale(prev => !prev);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          showScale ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showScale ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="text-sm text-indigo-700 font-medium">
                      Current Scale: {selectedScale.name}
                    </div>
                  </>
                )}
                {selectedChord && (
                  <div className="text-sm bg-indigo-100 px-3 py-1 rounded-full text-indigo-700 font-medium">
                    {selectedChord.degreeRoman} {selectedChord.type}
                  </div>
                )}
              </div>
            </div>
            
            <div className={`transition-all duration-300 ease-in-out ${
              isKeyboardExpanded ? 'opacity-100' : 'opacity-0'
            }`}>
              <Keyboard 
                highlightedNotes={highlightedNotes} 
                selectedScale={selectedScale}
                showScale={showScale}
              />
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <div>Use computer keyboard (Q-], A-\, Z-/) to play notes, 1-7 to play chords and 8, 9, 0, -, = for inversions. Hold <span className="font-bold">Shift</span> for higher octave. 
                <span className="font-bold"> Space</span> to play the current scale. </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AudioProvider>
  );
} 