'use client';

import { useEffect, useState } from 'react';
import { useAudio } from '@/utils/AudioContext';
import { 
  calculateOverallConsonance, 
  findClosestJustRatio, 
  INTERVAL_NAMES, 
  getConsonanceRating
} from '@/utils/IntervalUtils';

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

const ActiveIntervals = () => {
  const { activeNotes } = useAudio();
  const [intervals, setIntervals] = useState<IntervalInfo[]>([]);
  const [overallConsonance, setOverallConsonance] = useState<number>(0);
  const [consonanceDescription, setConsonanceDescription] = useState<string>('');

  useEffect(() => {
    // Calculate intervals between all active notes
    if (activeNotes.size < 2) {
      setIntervals([]);
      setOverallConsonance(0);
      setConsonanceDescription('');
      return;
    }

    const notesArray = Array.from(activeNotes);
    const newIntervals: IntervalInfo[] = [];
    
    // Calculate all interval pairs
    for (let i = 0; i < notesArray.length; i++) {
      for (let j = i + 1; j < notesArray.length; j++) {
        const note1 = notesArray[i];
        const note2 = notesArray[j];
        
        // Calculate the interval in steps (always positive and within an octave)
        const rawSteps = Math.abs(note2 - note1);
        const steps = rawSteps % 31;
        
        // Get the interval name
        const name = INTERVAL_NAMES[steps] || `Unknown (${steps} steps)`;
        
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
          justRatio,
          consonance,
          consonanceDescription
        });
      }
    }
    
    // Calculate overall consonance
    const consonanceResult = calculateOverallConsonance(activeNotes);
    setOverallConsonance(consonanceResult.rating);
    setConsonanceDescription(consonanceResult.description);
    
    // Sort intervals by consonance (most consonant first)
    newIntervals.sort((a, b) => b.consonance - a.consonance);
    
    setIntervals(newIntervals);
  }, [activeNotes]);

  if (intervals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-2">Active Intervals</h2>
        <p className="text-gray-500">Play multiple notes to see interval information</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-2">Active Intervals</h2>
      
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Overall Consonance:</span>
          <span className="font-bold">{overallConsonance.toFixed(2)}</span>
        </div>
        <div className="text-sm text-gray-700">{consonanceDescription}</div>
      </div>
      
      <div className="space-y-3">
        {intervals.map((interval, index) => (
          <div key={index} className="border-b pb-3 last:border-b-0">
            <div className="flex justify-between">
              <span className="font-medium">{interval.name}</span>
              <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                {interval.steps} steps
              </span>
            </div>
            
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-gray-600">Just Ratio:</span>{' '}
                <span className="font-medium">{interval.justRatio.ratio}</span>
              </div>
              <div>
                <span className="text-gray-600">Name:</span>{' '}
                <span>{interval.justRatio.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Error:</span>{' '}
                <span className={interval.justRatio.deviation < 5 ? 'text-green-600' : 'text-orange-600'}>
                  {interval.justRatio.deviation.toFixed(2)} cents
                </span>
              </div>
              <div>
                <span className="text-gray-600">Consonance:</span>{' '}
                <span>{interval.consonance.toFixed(1)} ({interval.consonanceDescription})</span>
              </div>
            </div>
            
            {interval.justRatio.secondaryRatio && (
              <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
                <div className="font-medium">Secondary Ratio: {interval.justRatio.secondaryRatio.ratio}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  <div>
                    <span className="text-gray-600">Name:</span>{' '}
                    <span>{interval.justRatio.secondaryRatio.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Error:</span>{' '}
                    <span className={interval.justRatio.secondaryRatio.deviation < 5 ? 'text-green-600' : 'text-orange-600'}>
                      {interval.justRatio.secondaryRatio.deviation.toFixed(2)} cents
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveIntervals; 