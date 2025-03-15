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

  // Commented out for future use
  // const getJustIntonationRatio = (interval: number): string => {
  //   switch(interval) {
  //     // Perfect consonances
  //     case 0: return "1:1";
  //     case 18: return "3:2";
  //     case 31: return "2:1";
  //     // ... other cases
  //   }
  //   return "";
  // };

  // Add this function to get chord structure description
  const getChordStructure = (chordType: string): string => {
    switch(chordType) {
      // Triads
      case "subminor": return "6:7:9 ratio - consonant root triad";
      case "minor": return "6/5/4 ratio - consonant minor triad";
      case "neutral": return "18:22:27 ratio - important harmonic option";
      case "major": return "4:5:6 ratio - consonant major triad";
      case "supermajor": return "9/7/6 ratio - consonant root triad";
      case "diminished": return "Minor third + diminished fifth";
      case "augmented": return "Major third + augmented fifth";
      case "harmonic diminished": return "5:6:7 ratio - more consonant than standard diminished";
      
      // Seventh chords
      case "harmonic 7": return "4:5:6:7 ratio - natural harmonic series";
      case "undecimal tetrad": return "6:7:9:11 ratio - low harmonic complexity";
      case "utonal tetrad": return "12/10/8/7 ratio - undertone series";
      case "9-over tetrad": return "9/7/6/5 ratio - alternative dominant seventh";
      case "major 7": return "Major triad + major seventh";
      case "dominant 7": return "Major triad + minor seventh";
      case "minor 7": return "Minor triad + minor seventh";
      case "neutral minor 7": return "18:22:27:33 ratio - distinctly cold sound";
      
      default: return "";
    }
  };

  if (sortedNotes.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 h-64 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Play notes or select a chord to see interval information
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      {selectedChord && (
        <div className="mb-4 text-center">
          <span className="text-lg font-bold text-indigo-700">{selectedChord.degreeRoman}</span>
          <span className="ml-2 text-gray-600">{selectedChord.type}</span>
        </div>
      )}
      
      <div className="flex items-stretch space-x-4">
        {/* Vertical note stack */}
        <div className="w-24 flex-shrink-0">
          <div className="flex flex-col space-y-2 items-center">
            {sortedNotes.map((note, index) => (
              <div 
                key={`note-${index}`} 
                className={`
                  w-full py-2 px-3 rounded-md text-center
                  ${index === 0 ? 'bg-indigo-100 text-indigo-800' : 
                    index === 1 ? 'bg-blue-100 text-blue-800' : 
                    index === 2 ? 'bg-green-100 text-green-800' : 
                    'bg-amber-100 text-amber-800'}
                `}
              >
                <div className="font-bold">{getStepNoteName(note)}</div>
                <div className="text-xs opacity-75">
                  {index === 0 ? '5th' : 
                   index === sortedNotes.length - 1 ? 'Root' : 
                   index === 1 ? '7th' : 
                   index === 2 ? '3rd' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Interval information */}
        <div className="flex-grow">
          <div className="mb-3 p-2 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Consonance:</span>
              <div 
                className={`px-2 py-1 rounded-md text-sm font-bold ${getConsonanceColor(overallConsonance)} ${getConsonanceTextColor(overallConsonance)}`}
              >
                {overallConsonance.toFixed(1)}
              </div>
            </div>
            <div className="text-sm text-gray-700">{consonanceDescription}</div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {intervals.map((interval, index) => (
              <div 
                key={index} 
                className="border-l-4 pl-2 py-1 text-sm flex items-center justify-between"
                style={{ borderLeftColor: `rgba(${Math.round(255 - interval.consonance * 25)}, ${Math.round(interval.consonance * 25)}, 100, 0.8)` }}
              >
                <div>
                  <div className="font-medium">{interval.name}</div>
                  <div className="text-xs text-gray-500">
                    {getStepNoteName(interval.note1)} - {getStepNoteName(interval.note2)}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded-md">
                    {interval.steps} steps
                  </div>
                  <div className="text-xs mt-1">
                    <span className="text-gray-600">{interval.justRatio.ratio}</span>
                    <span className={interval.justRatio.deviation < 5 ? 'text-green-600 ml-1' : 'text-orange-600 ml-1'}>
                      (±{interval.justRatio.deviation.toFixed(1)}¢)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedChord && (
        <div className="mt-2 text-sm text-gray-600">
          {getChordStructure(selectedChord.type) && (
            <div className="mt-1 p-2 bg-indigo-50 rounded-md">
              <p>{getChordStructure(selectedChord.type)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChordVisualizer; 