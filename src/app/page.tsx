'use client';

import React, { useState } from 'react';
import { AudioProvider } from '../utils/AudioContext';
import Keyboard from '../components/Keyboard';
import ScaleBrowser from '../components/ScaleBrowser';
import ActiveIntervals from '../components/ActiveIntervals';

export default function Home() {
  const [highlightedNotes, setHighlightedNotes] = useState<Set<number>>(new Set());

  return (
    <AudioProvider>
      <div className="container mx-auto px-4 py-8">
        <section className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">31-EDO Explorer</h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Explore the fascinating world of 31-EDO (Equal Division of the Octave) music theory with this interactive tool.
            Play notes, discover scales, and learn about microtonal intervals.
          </p>
        </section>

        <section id="keyboard" className="mb-8 pt-4">
          <h2 className="text-2xl font-bold mb-4">Interactive 31-EDO Keyboard</h2>
          <p className="text-gray-600 mb-4">
            Click on the keys or use your computer keyboard (Q-], A-\, Z-/) to play notes.
            Play multiple notes to explore intervals and their properties.
          </p>
          <div className="bg-white rounded-lg shadow-md p-4">
            <Keyboard highlightedNotes={highlightedNotes} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section id="scales" className="pt-4">
            <h2 className="text-2xl font-bold mb-4">Scale Browser</h2>
            <p className="text-gray-600 mb-4">
              Browse through different scale families and explore their properties. 
              Play scales and their chords to hear how they sound in 31-EDO.
            </p>
            <ScaleBrowser onHighlightNotes={setHighlightedNotes} />
          </section>

          <section id="intervals" className="pt-4">
            <h2 className="text-2xl font-bold mb-4">Active Intervals</h2>
            <p className="text-gray-600 mb-4">
              Play multiple notes on the keyboard to see detailed information about the intervals between them.
              Learn about just intonation approximations and consonance ratings.
            </p>
            <ActiveIntervals />
          </section>
        </div>

        <section id="about" className="mb-8 pt-4">
          <h2 className="text-2xl font-bold mb-4">About 31-EDO</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">What is 31-EDO?</h3>
                <p className="mb-3">
                  31-EDO (31 Equal Division of the Octave) is a microtonal tuning system that divides the octave into 31 equal parts, 
                  each approximately 38.7 cents wide.
                </p>
                <p className="mb-3">
                  This tuning system is particularly valued because it provides excellent approximations of many just intonation intervals, 
                  including the major third (5:4), minor third (6:5), and harmonic seventh (7:4).
                </p>
                <p>
                  31-EDO offers a rich palette of harmonies not available in standard 12-EDO tuning, including neutral intervals 
                  (between major and minor) and various septimal intervals.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Excellent approximations of 5-limit and 7-limit just intonation</li>
                  <li>Neutral intervals (between major and minor)</li>
                  <li>Harmonic seventh chords with good tuning</li>
                  <li>Rich variety of consonant triads and tetrads</li>
                  <li>Historical connection to 1/4-comma meantone temperament</li>
                </ul>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Harmonic Properties</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Just Interval</th>
                      <th className="border p-2 text-left">Ratio</th>
                      <th className="border p-2 text-left">31-EDO Steps</th>
                      <th className="border p-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Perfect Fifth</td>
                      <td className="border p-2">3:2</td>
                      <td className="border p-2">18</td>
                      <td className="border p-2">-1.1 cents</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Major Third</td>
                      <td className="border p-2">5:4</td>
                      <td className="border p-2">10</td>
                      <td className="border p-2">+0.9 cents</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Minor Third</td>
                      <td className="border p-2">6:5</td>
                      <td className="border p-2">8</td>
                      <td className="border p-2">-2.0 cents</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>
      </div>
    </AudioProvider>
  );
} 