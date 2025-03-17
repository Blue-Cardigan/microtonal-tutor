import { Scale, Chord, ROMAN_NUMERALS, ROMAN_NUMERALS_MAJOR } from '../types/scale';
import { getFunctionFromDegree, getChordType } from './scaleUtils';

// Generate triads for a scale
export const generateTriads = (scale: Scale): Chord[] => {
  const degrees = scale.degrees;
  const triads: Chord[] = [];
  
  // Determine if the scale is major-like or minor-like based on the third degree
  let isMajorLike = true;
  
  // Find the third degree (index 2)
  if (degrees.length > 2) {
    const thirdInterval = degrees[2] - degrees[0];
    // If the third is minor (8) or smaller, it's minor-like
    isMajorLike = thirdInterval >= 9;
  }
  
  // Create extended degrees array to make it easier to find notes beyond the octave
  const extendedDegrees = [...degrees];
  for (let i = 1; i < 3; i++) {
    extendedDegrees.push(...degrees.slice(1).map(d => d + (i * 31)));
  }
  
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
  
  // Find the third degree (index 2)
  if (degrees.length > 2) {
    const thirdInterval = degrees[2] - degrees[0];
    // If the third is minor (8) or smaller, it's minor-like
    isMajorLike = thirdInterval >= 9;
  }
  
  // Create extended degrees array to make it easier to find notes beyond the octave
  const extendedDegrees = [...degrees];
  for (let i = 1; i < 3; i++) {
    extendedDegrees.push(...degrees.slice(1).map(d => d + (i * 31)));
  }
  
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
      sevenths
    };
  }
  
  // Otherwise, generate chords algorithmically
  const triads = generateTriads(scale);
  const sevenths = generateSeventhChords(scale);
  
  return {
    triads,
    sevenths
  };
}; 