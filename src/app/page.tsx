'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AudioProvider, useAudio } from '../utils/AudioContext';
import Keyboard from '../components/Keyboard';
import ScaleBrowser from '../components/ScaleBrowser';
import ChordVisualizer from '../components/ChordVisualizer';
import CircleVisualizer from '../components/CircleVisualizer';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Sound Source Toggle Component
const SoundSourceToggle = () => {
  const { soundSource, setSoundSource } = useAudio();
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg shadow-sm" title="Select sound source">
        <button
          onClick={() => setSoundSource('rhodes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            soundSource === 'rhodes' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
          title="Rhodes piano sample"
        >
          {/* Piano icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <line x1="8" y1="4" x2="8" y2="20" />
            <line x1="16" y1="4" x2="16" y2="20" />
          </svg>
          <span>Rhodes</span>
        </button>
        <button
          onClick={() => setSoundSource('synth')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            soundSource === 'synth' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
          title="Synthesized sound"
        >
          {/* Wave icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c0-3.5 5-3.5 5 0s5-3.5 5 0 5-3.5 5 0" />
          </svg>
          <span>Synth</span>
        </button>
      </div>
    </div>
  );
};

// Add at the top of the file after imports
const DebugState = () => {
  const { activeNotes } = useAudio();
  const [highlightedNotes, setHighlightedNotes] = useState<Set<number>>(new Set());
  const [highlightSource, setHighlightSource] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Get the global highlightedNotes from the parent component
  useEffect(() => {
    const updateFromDOM = () => {
      const homeComponent = document.querySelector('[data-debug-highlighted]');
      if (homeComponent) {
        const notesString = homeComponent.getAttribute('data-debug-highlighted');
        const sourceString = homeComponent.getAttribute('data-debug-source');
        
        if (notesString) {
          try {
            const notesArray = JSON.parse(notesString);
            setHighlightedNotes(new Set(notesArray));
          } catch (e) {
            console.error('Failed to parse debug data for notes', e);
          }
        }
        
        if (sourceString) {
          setHighlightSource(sourceString);
        }
      }
    };
    
    // Initial update
    updateFromDOM();
    
    // Set up an interval to refresh the values
    const intervalId = setInterval(() => {
      updateFromDOM();
      setRefreshCounter(prev => prev + 1);
    }, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed top-0 right-0 bg-white p-2 shadow-md z-50 text-xs max-w-64 overflow-auto">
      <div className="text-gray-400 text-xs">Refreshed: {refreshCounter}</div>
      <div>
        <strong>Active Notes: </strong>
        {Array.from(activeNotes).join(', ') || 'None'}
      </div>
      <div>
        <strong>Highlighted Notes: </strong>
        {Array.from(highlightedNotes).join(', ') || 'None'}
      </div>
      <div>
        <strong>Highlight Source: </strong>
        {highlightSource || 'None'}
      </div>
    </div>
  );
};

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
  // New flag to track the source of highlighted notes
  const [highlightSource, setHighlightSource] = useState<'scale' | 'chord' | 'individual' | null>(null);

  // Access audio functions for cleanup
  const { stopAllNotes } = useAudio();

  // Memoize these handlers to prevent them from changing on every render
  const handleHighlightNotes = useCallback((notes: Set<number>, source: 'scale' | 'chord' | 'individual' = 'scale') => {
    setHighlightedNotes(notes);
    setHighlightSource(source);
  }, []);

  const handleChordSelect = useCallback((chord: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null) => {
    setSelectedChord(chord);
    // If selecting a chord, update the highlight source
    if (chord) {
      setHighlightSource('chord');
    }
  }, []);

  const handleScaleSelect = useCallback((scale: {
    name: string;
    degrees: number[];
  } | null) => {
    // Clear any active blue highlights when changing scales
    stopAllNotes(0.1);
    
    setSelectedScale(scale);
    // If selecting a new scale, make sure highlight source is 'scale'
    if (scale) {
      setHighlightSource('scale');
    }
  }, [stopAllNotes]);

  // Cleanup effect when toggling scale visibility
  useEffect(() => {
    // When the user toggles the scale visibility, ensure active notes are cleared
    stopAllNotes(0.1);
    
    // Update highlighted notes based on showScale toggle
    if (selectedScale) {
      if (showScale) {
        // Show scale degrees when showScale is true
        setHighlightedNotes(new Set(selectedScale.degrees));
        setHighlightSource('scale');
      } else {
        // Clear highlight notes when showScale is false
        setHighlightedNotes(new Set());
        // Keep highlightSource as 'scale' so components know the context
        setHighlightSource('scale');
      }
    }
  }, [showScale, stopAllNotes, selectedScale]);

  return (
    <AudioProvider>
      <div 
        className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-48"
        data-debug-highlighted={JSON.stringify(Array.from(highlightedNotes))}
        data-debug-source={highlightSource}
      >
        {process.env.NODE_ENV === 'development' && <DebugState />}
        
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
                  <ScaleBrowser 
                    onHighlightNotes={handleHighlightNotes} 
                    onChordSelect={handleChordSelect}
                    onScaleSelect={handleScaleSelect}
                  />
                </div>
              </div>
            </div>
            
            {/* Chord Visualizer - Takes up 1/3 of the width on large screens */}
            <div className="lg:col-span-1 space-y-4">
              {/* Circle Visualizer */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4">
                  <CircleVisualizer 
                    highlightedNotes={highlightedNotes}
                    selectedScale={selectedScale}
                    showScale={showScale}
                    highlightSource={highlightSource}
                  />
                </div>
              </div>
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
              <div className="flex items-center gap-4">
                {selectedScale && isKeyboardExpanded && (
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
                    
                    {/* Add the Sound Source Toggle */}
                    <div onClick={(e) => e.stopPropagation()} className="ml-2 pl-2 border-l border-gray-200">
                      <SoundSourceToggle />
                    </div>
                  </>
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
                highlightSource={highlightSource}
                onHighlightNotes={handleHighlightNotes}
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