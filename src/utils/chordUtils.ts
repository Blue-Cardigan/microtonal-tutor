import { Scale, Chord, ROMAN_NUMERALS, ROMAN_NUMERALS_MAJOR } from '../types/scale';
import { getFunctionFromDegree, getChordType } from './scaleUtils';

// Helper function to create extended degrees array
const createExtendedDegrees = (degrees: number[]): number[] => {
  // Remove the octave from both the original and the extension
  const degreesWithoutOctave = degrees.slice(0, -1);
  return [...degreesWithoutOctave, ...degreesWithoutOctave.map(d => d + 31), 31];
};

// Generate triads for a scale
export const generateTriads = (scale: Scale): Chord[] => {
  const degrees = scale.degrees;
  const triads: Chord[] = [];
  
  // Determine if the scale is major-like or minor-like based on the third degree
  let isMajorLike = true;
  if (degrees.length > 2) {
    const thirdInterval = degrees[2] - degrees[0];
    isMajorLike = thirdInterval >= 9;
  }
  
  // Create extended degrees array with one octave above
  const extendedDegrees = createExtendedDegrees(degrees);
  
  // Generate a triad for each scale degree
  for (let i = 0; i < degrees.length - 1; i++) {
    const root = degrees[i];
    
    // Find the best third and fifth for this root
    let bestThird = -1;
    let bestFifth = -1;
    
    // Look for intervals between 7-11 steps for thirds
    for (let j = 0; j < extendedDegrees.length; j++) {
      const interval = extendedDegrees[j] - root;
      if (interval >= 7 && interval <= 11) {
        bestThird = extendedDegrees[j];
        break;
      }
    }
    
    // Look for intervals between 17-19 steps for fifths
    for (let j = 0; j < extendedDegrees.length; j++) {
      const interval = extendedDegrees[j] - root;
      if (interval >= 17 && interval <= 19) {
        bestFifth = extendedDegrees[j];
        break;
      }
    }
    
    // If we couldn't find ideal intervals, find the closest approximations
    if (bestThird === -1) {
      let closestDiff = Infinity;
      for (let j = 0; j < extendedDegrees.length; j++) {
        const interval = extendedDegrees[j] - root;
        if (interval > 0 && Math.abs(interval - 9) < closestDiff) {
          closestDiff = Math.abs(interval - 9);
          bestThird = extendedDegrees[j];
        }
      }
    }
    
    if (bestFifth === -1) {
      let closestDiff = Infinity;
      for (let j = 0; j < extendedDegrees.length; j++) {
        const interval = extendedDegrees[j] - root;
        if (interval > bestThird && Math.abs(interval - 18) < closestDiff) {
          closestDiff = Math.abs(interval - 18);
          bestFifth = extendedDegrees[j];
        }
      }
    }
    
    // Only create a chord if we have at least a root and one other note
    if (bestThird !== -1 || bestFifth !== -1) {
      const chordNotes = [root];
      const intervals = [];
      
      if (bestThird !== -1) {
        chordNotes.push(bestThird);
        intervals.push(bestThird - root);
      }
      
      if (bestFifth !== -1) {
        chordNotes.push(bestFifth);
        if (bestThird !== -1) {
          intervals.push(bestFifth - bestThird);
        } else {
          intervals.push(bestFifth - root);
        }
      }
      
      // Determine chord type based on intervals
      const chordType = getChordType(intervals);
      
      // Create the chord object
      const chord: Chord = {
        degree: i,
        degreeRoman: isMajorLike ? ROMAN_NUMERALS_MAJOR[i] : ROMAN_NUMERALS[i],
        type: chordType,
        function: getFunctionFromDegree(i, isMajorLike),
        notes: chordNotes,
        intervals: intervals
      };
      
      triads.push(chord);
    }
  }
  
  return triads;
};

// Generate seventh chords for a scale
export const generateSeventhChords = (scale: Scale): Chord[] => {
  const degrees = scale.degrees;
  const sevenths: Chord[] = [];
  
  // Determine if the scale is major-like or minor-like based on the third degree
  let isMajorLike = true;
  if (degrees.length > 2) {
    const thirdInterval = degrees[2] - degrees[0];
    isMajorLike = thirdInterval >= 9;
  }
  
  // Create extended degrees array with one octave above
  const extendedDegrees = createExtendedDegrees(degrees);
  
  // Generate a seventh chord for each scale degree
  for (let i = 0; i < degrees.length - 1; i++) {
    const root = degrees[i];
    
    // Find the best third, fifth, and seventh for this root
    let bestThird = -1;
    let bestFifth = -1;
    let bestSeventh = -1;
    
    // Look for intervals between 7-11 steps for thirds
    for (let j = 0; j < extendedDegrees.length; j++) {
      const interval = extendedDegrees[j] - root;
      if (interval >= 7 && interval <= 11) {
        bestThird = extendedDegrees[j];
        break;
      }
    }
    
    // Look for intervals between 17-19 steps for fifths
    for (let j = 0; j < extendedDegrees.length; j++) {
      const interval = extendedDegrees[j] - root;
      if (interval >= 17 && interval <= 19) {
        bestFifth = extendedDegrees[j];
        break;
      }
    }
    
    // Look for intervals between 25-28 steps for sevenths
    for (let j = 0; j < extendedDegrees.length; j++) {
      const interval = extendedDegrees[j] - root;
      if (interval >= 25 && interval <= 28) {
        bestSeventh = extendedDegrees[j];
        break;
      }
    }
    
    // If we couldn't find ideal intervals, find the closest approximations
    if (bestThird === -1) {
      let closestDiff = Infinity;
      for (let j = 0; j < extendedDegrees.length; j++) {
        const interval = extendedDegrees[j] - root;
        if (interval > 0 && Math.abs(interval - 9) < closestDiff) {
          closestDiff = Math.abs(interval - 9);
          bestThird = extendedDegrees[j];
        }
      }
    }
    
    if (bestFifth === -1) {
      let closestDiff = Infinity;
      for (let j = 0; j < extendedDegrees.length; j++) {
        const interval = extendedDegrees[j] - root;
        if (interval > bestThird && Math.abs(interval - 18) < closestDiff) {
          closestDiff = Math.abs(interval - 18);
          bestFifth = extendedDegrees[j];
        }
      }
    }
    
    if (bestSeventh === -1) {
      let closestDiff = Infinity;
      for (let j = 0; j < extendedDegrees.length; j++) {
        const interval = extendedDegrees[j] - root;
        if (interval > bestFifth && Math.abs(interval - 27) < closestDiff) {
          closestDiff = Math.abs(interval - 27);
          bestSeventh = extendedDegrees[j];
        }
      }
    }
    
    // Only create a chord if we have at least a root and one other note
    if (bestThird !== -1 || bestFifth !== -1 || bestSeventh !== -1) {
      const chordNotes = [root];
      const intervals = [];
      
      if (bestThird !== -1) {
        chordNotes.push(bestThird);
        intervals.push(bestThird - root);
      }
      
      if (bestFifth !== -1) {
        chordNotes.push(bestFifth);
        if (bestThird !== -1) {
          intervals.push(bestFifth - bestThird);
        } else {
          intervals.push(bestFifth - root);
        }
      }
      
      if (bestSeventh !== -1) {
        chordNotes.push(bestSeventh);
        if (bestFifth !== -1) {
          intervals.push(bestSeventh - bestFifth);
        } else if (bestThird !== -1) {
          intervals.push(bestSeventh - bestThird);
        } else {
          intervals.push(bestSeventh - root);
        }
      }
      
      // Determine chord type based on intervals
      const chordType = getChordType(intervals);
      
      // Create the chord object
      const chord: Chord = {
        degree: i,
        degreeRoman: isMajorLike ? ROMAN_NUMERALS_MAJOR[i] : ROMAN_NUMERALS[i],
        type: chordType,
        function: getFunctionFromDegree(i, isMajorLike),
        notes: chordNotes,
        intervals: intervals
      };
      
      sevenths.push(chord);
    }
  }
  
  return sevenths;
};

// Traditional triad generation based on scale degrees
const generateTraditionalTriads = (scale: Scale): Chord[] => {
  const triads: Chord[] = [];
  const degrees = scale.degrees;
  const isMajorLike = scale.isMajorLike;
  
  // Create extended degrees array with one octave above
  const extendedDegrees = createExtendedDegrees(degrees);
  
  for (let i = 0; i < degrees.length - 1; i++) {
    const root = degrees[i];
    const third = extendedDegrees[i + 2];
    const fifth = extendedDegrees[i + 4];
    
    const intervals = [
      third - root,
      fifth - third
    ];
    
    const chord: Chord = {
      degree: i,
      degreeRoman: isMajorLike ? ROMAN_NUMERALS_MAJOR[i] : ROMAN_NUMERALS[i],
      type: getChordType(intervals),
      function: getFunctionFromDegree(i, isMajorLike),
      notes: [root, third, fifth],
      intervals: intervals
    };
    
    triads.push(chord);
  }
  
  return triads;
};

// Traditional seventh chord generation based on scale degrees
const generateTraditionalSevenths = (scale: Scale): Chord[] => {
  const sevenths: Chord[] = [];
  const degrees = scale.degrees;
  const isMajorLike = scale.isMajorLike;
  
  // Create extended degrees array with one octave above
  const extendedDegrees = createExtendedDegrees(degrees);
  
  for (let i = 0; i < degrees.length - 1; i++) {
    const root = degrees[i];
    const third = extendedDegrees[i + 2];
    const fifth = extendedDegrees[i + 4];
    const seventh = extendedDegrees[i + 6];
    
    const intervals = [
      third - root,
      fifth - third,
      seventh - fifth
    ];
    
    const chord: Chord = {
      degree: i,
      degreeRoman: isMajorLike ? ROMAN_NUMERALS_MAJOR[i] : ROMAN_NUMERALS[i],
      type: getChordType(intervals),
      function: getFunctionFromDegree(i, isMajorLike),
      notes: [root, third, fifth, seventh],
      intervals: intervals
    };
    
    sevenths.push(chord);
  }
  
  return sevenths;
};

// Generate chords for a scale
export const generateChordsForScale = (scale: Scale) => {
  // If the scale has a chord system defined, use it
  if (scale.chordSystem) {
    const triads: Chord[] = [];
    const sevenths: Chord[] = [];
    
    // Extract chords from the chord system
    Object.values(scale.chordSystem.chordsByDegree).forEach(degreeGroup => {
      degreeGroup.forEach(group => {
        group.chords.forEach(chord => {
          if (chord.notes.length <= 3) {
            triads.push(chord);
          } else {
            sevenths.push(chord);
          }
        });
      });
    });
    
    return {
      triads,
      sevenths,
      traditionalTriads: generateTraditionalTriads(scale),
      traditionalSevenths: generateTraditionalSevenths(scale)
    };
  }
  
  // Otherwise, generate chords algorithmically
  const triads = generateTriads(scale);
  const sevenths = generateSeventhChords(scale);
  
  return {
    triads,
    sevenths,
    traditionalTriads: generateTraditionalTriads(scale),
    traditionalSevenths: generateTraditionalSevenths(scale)
  };
}; 