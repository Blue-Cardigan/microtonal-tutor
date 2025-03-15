'use client';

import React, { useState } from 'react';
import { AudioProvider } from '../utils/AudioContext';
import Keyboard from '../components/Keyboard';
import ScaleBrowser from '../components/ScaleBrowser';
import ChordVisualizer from '../components/ChordVisualizer';
import Footer from '../components/Footer';

export default function Home() {
  const [highlightedNotes, setHighlightedNotes] = useState<Set<number>>(new Set());
  const [selectedChord, setSelectedChord] = useState<{
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null>(null);

  // Handle chord selection from ScaleBrowser
  const handleChordSelect = (chord: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null) => {
    setSelectedChord(chord);
  };

  return (
    <AudioProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold text-indigo-700">31-EDO Explorer</h1>
            <p className="text-gray-600 mt-2">
              Explore microtonal music with this interactive 31-tone equal temperament tool
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Keyboard Section - Always visible and prominent */}
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Interactive Keyboard</h2>
                <p className="text-gray-600 mb-4">
                  Click keys or use your computer keyboard (Q-], A-\, Z-/) to play notes.
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm font-medium">Hold Shift for higher octave</span>
                </p>
                <Keyboard highlightedNotes={highlightedNotes} />
              </div>
            </div>
          </section>

          {/* Scale Browser and Chord Visualizer Side by Side */}
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scale Browser - Takes up 2/3 of the width on large screens */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Scale Browser</h2>
                    <ScaleBrowser 
                      onHighlightNotes={setHighlightedNotes} 
                      onChordSelect={handleChordSelect}
                    />
                  </div>
                </div>
              </div>
              
              {/* Chord Visualizer - Takes up 1/3 of the width on large screens */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Chord Visualizer</h2>
                    <ChordVisualizer selectedChord={selectedChord} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About 31-EDO</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-3">What is 31-EDO?</h3>
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      31-EDO (31 Equal Division of the Octave) is a microtonal tuning system that divides the octave into 31 equal parts, 
                      each approximately 38.7 cents wide.
                    </p>
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      This tuning system is particularly valued because it provides excellent approximations of many just intonation intervals, 
                      including the major third (5:4), minor third (6:5), and harmonic seventh (7:4).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      31-EDO offers a rich palette of harmonies not available in standard 12-EDO tuning, including neutral intervals 
                      (between major and minor) and various septimal intervals.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-3">Key Features</h3>
                    <ul className="space-y-2 text-gray-700 mb-6">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Excellent approximations of 5-limit and 7-limit just intonation
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Neutral intervals (between major and minor)
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Harmonic seventh chords with good tuning
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Rich variety of consonant triads and tetrads
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Historical connection to 1/4-comma meantone temperament
                      </li>
                    </ul>
                    
                    <h3 className="text-xl font-semibold text-indigo-600 mb-3">Harmonic Properties</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Just Interval</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">31-EDO Steps</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Perfect Fifth</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">3:2</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">18</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">-1.1 cents</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Major Third</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">5:4</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">10</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">+0.9 cents</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Minor Third</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">6:5</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">8</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">-2.0 cents</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AudioProvider>
  );
} 