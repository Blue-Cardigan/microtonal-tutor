'use client';

import React, { useEffect, useState } from 'react';
import { useAudio } from '../utils/AudioContext';
import { 
  calculateOverallConsonance, 
  findClosestJustRatio, 
  INTERVAL_NAMES, 
  getConsonanceRating,
  getStepNoteName
} from '../utils/IntervalUtils';

interface ConsonanceResult {
  rating: number;
  intervalRatings: number[];
  description: string;
}

interface IntervalInfo {
  note1: number;
  note2: number;
  steps: number;
  name: string;
  justRatio: {
    ratio: string;
    name: string;
    cents: number;
    deviation: number;
    secondaryRatio: {
      ratio: string;
      name: string;
      cents: number;
      deviation: number;
    } | null;
  };
  consonance: number;
  consonanceDescription: string;
}

interface ChordVisualizerProps {
  selectedChord?: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null;
}

const ChordVisualizer = ({ selectedChord }: ChordVisualizerProps) => {
  const { activeNotes } = useAudio();
  const [intervals, setIntervals] = useState<IntervalInfo[]>([]);
  const [overallConsonance, setOverallConsonance] = useState<number>(0);
  const [consonanceDescription, setConsonanceDescription] = useState<string>('');
  const [sortedNotes, setSortedNotes] = useState<number[]>([]);

  useEffect(() => {
    // Determine which notes to use - either from selectedChord or activeNotes
    const notesToUse = selectedChord?.notes || Array.from(activeNotes);
    
    // Sort notes from highest to lowest for vertical display
    const sorted = [...notesToUse].sort((a, b) => b - a);
    setSortedNotes(sorted);
    
    // Calculate intervals between all notes
    if (notesToUse.length < 2) {
      setIntervals([]);
      setOverallConsonance(0);
      setConsonanceDescription('');
      return;
    }

    const newIntervals: IntervalInfo[] = [];
    
    // Calculate all interval pairs
    for (let i = 0; i < notesToUse.length; i++) {
      for (let j = i + 1; j < notesToUse.length; j++) {
        const note1 = notesToUse[i];
        const note2 = notesToUse[j];
        
        // Calculate the interval in steps (always positive and within an octave)
        const rawSteps = Math.abs(note2 - note1);
        const steps = rawSteps % 31;
        
        // Get the interval name
        const name = INTERVAL_NAMES[steps as keyof typeof INTERVAL_NAMES] || `Unknown (${steps} steps)`;
        
        // Find the closest just ratio
        const justRatio = findClosestJustRatio(steps);
        
        // Get consonance rating
        const consonance = getConsonanceRating(steps);
        
        // Determine consonance description
        let consonanceDescription = '';
        if (consonance >= 9) {
          consonanceDescription = 'Extremely Consonant';
        } else if (consonance >= 8) {
          consonanceDescription = 'Very Consonant';
        } else if (consonance >= 7) {
          consonanceDescription = 'Consonant';
        } else if (consonance >= 6) {
          consonanceDescription = 'Moderately Consonant';
        } else if (consonance >= 5) {
          consonanceDescription = 'Somewhat Consonant';
        } else if (consonance >= 4) {
          consonanceDescription = 'Somewhat Dissonant';
        } else if (consonance >= 3) {
          consonanceDescription = 'Moderately Dissonant';
        } else if (consonance >= 2) {
          consonanceDescription = 'Dissonant';
        } else if (consonance >= 1) {
          consonanceDescription = 'Very Dissonant';
        } else {
          consonanceDescription = 'Extremely Dissonant';
        }
        
        newIntervals.push({
          note1,
          note2,
          steps,
          name,
          justRatio: justRatio as {
            ratio: string;
            name: string;
            cents: number;
            deviation: number;
            secondaryRatio: {
              ratio: string;
              name: string;
              cents: number;
              deviation: number;
            } | null;
          },
          consonance,
          consonanceDescription
        });
      }
    }
    
    // Calculate overall consonance
    const consonanceResult = calculateOverallConsonance(new Set(notesToUse)) as ConsonanceResult;
    setOverallConsonance(consonanceResult.rating);
    setConsonanceDescription(consonanceResult.description);
    
    // Sort intervals by consonance (most consonant first)
    newIntervals.sort((a, b) => b.consonance - a.consonance);
    
    setIntervals(newIntervals);
  }, [activeNotes, selectedChord]);

  // Get color based on consonance rating
  const getConsonanceColor = (rating: number): string => {
    if (rating >= 9) return 'bg-green-500';
    if (rating >= 7) return 'bg-green-400';
    if (rating >= 5) return 'bg-yellow-400';
    if (rating >= 3) return 'bg-orange-400';
    return 'bg-red-400';
  };

  // Get text color based on consonance rating
  const getConsonanceTextColor = (rating: number): string => {
    if (rating >= 5) return 'text-gray-800';
    return 'text-white';
  };

  if (sortedNotes.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 h-48 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Play notes or select a chord to see interval information
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      {selectedChord && (
        <div className="mb-3 text-center">
          <span className="text-lg font-bold text-indigo-700">{selectedChord.degreeRoman}</span>
          <span className="ml-2 text-gray-600">{selectedChord.type}</span>
        </div>
      )}
      
      {/* Overall Consonance Meter */}
      <div className="mb-3 p-2 rounded-lg bg-gray-50">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm text-gray-700">Overall Consonance:</span>
          <div 
            className={`px-2 py-1 rounded-md text-sm font-bold ${getConsonanceColor(overallConsonance)} ${getConsonanceTextColor(overallConsonance)}`}
          >
            {overallConsonance.toFixed(1)}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${getConsonanceColor(overallConsonance)} h-2.5 rounded-full`} 
            style={{ width: `${Math.min(overallConsonance * 10, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-600 mt-1">{consonanceDescription}</div>
      </div>
      
      {/* Visual Interval Representation */}
      <div className="mb-3">
        <div className="flex items-center space-x-1">
          {sortedNotes.map((note, index) => (
            <React.Fragment key={`note-vis-${index}`}>
              {index > 0 && (
                <div className="h-8 flex items-center">
                  <div 
                    className={`h-0.5 ${getConsonanceColor(
                      intervals.find(i => 
                        (i.note1 === sortedNotes[index-1] && i.note2 === note) || 
                        (i.note2 === sortedNotes[index-1] && i.note1 === note)
                      )?.consonance || 5
                    )}`} 
                    style={{ width: `${Math.max((note - sortedNotes[index-1]) * 3, 10)}px` }}
                  ></div>
                </div>
              )}
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-indigo-100 text-indigo-800' : 
                    index === 1 ? 'bg-blue-100 text-blue-800' : 
                    index === 2 ? 'bg-green-100 text-green-800' : 
                    'bg-amber-100 text-amber-800'}
                `}
              >
                {getStepNoteName(note).replace(/[0-9]/g, '')}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Interval List - Compact Version */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {intervals.map((interval, index) => (
          <div 
            key={`interval-${index}`} 
            className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="font-medium text-gray-800 text-sm">
                {getStepNoteName(interval.note1)} - {getStepNoteName(interval.note2)}
              </div>
              <div 
                className={`px-2 py-0.5 rounded text-xs font-bold ${getConsonanceColor(interval.consonance)} ${getConsonanceTextColor(interval.consonance)}`}
              >
                {interval.consonance.toFixed(1)}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <div>{interval.name}</div>
              <div>{interval.justRatio.ratio} {interval.justRatio.name}</div>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
};

export default ChordVisualizer; 

