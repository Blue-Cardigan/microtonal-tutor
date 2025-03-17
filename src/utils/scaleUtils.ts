// Define 31-EDO interval classifications
export const getIntervalType = (interval: number): string => {
  switch(interval) {
    // Seconds
    case 3: return "minor second";
    case 4: return "neutral second";
    case 5: return "major second";
    case 6: return "supermajor second";
    
    // Thirds
    case 7: return "subminor third";
    case 8: return "minor third";
    case 9: return "neutral third";
    case 10: return "major third";
    case 11: return "supermajor third";
    
    // Fourths
    case 12: return "subperfect fourth";
    case 13: return "perfect fourth";
    case 14: return "superperfect fourth";
    
    // Tritones
    case 15: return "diminished fifth";
    case 16: return "neutral tritone";
    
    // Fifths
    case 17: return "diminished fifth";
    case 18: return "perfect fifth";
    case 19: return "augmented fifth";
    
    // Sixths
    case 20: return "subminor sixth";
    case 21: return "minor sixth";
    case 22: return "neutral sixth";
    case 23: return "major sixth";
    case 24: return "supermajor sixth";
    
    // Sevenths
    case 25: return "subminor seventh";
    case 26: return "minor seventh";
    case 27: return "neutral seventh";
    case 28: return "major seventh";
    
    // Octave
    case 31: return "perfect octave";
    
    default: return `${interval} steps`;
  }
};

// Function to determine chord function based on scale degree
export const getFunctionFromDegree = (degree: number, isMajorLike: boolean): string => {
  if (isMajorLike) {
    switch (degree) {
      case 0: return "tonic";
      case 1: return "supertonic";
      case 2: return "mediant";
      case 3: return "subdominant";
      case 4: return "dominant";
      case 5: return "submediant";
      case 6: return "leading tone";
      default: return "unknown";
    }
  } else {
    // Minor-like scale
    switch (degree) {
      case 0: return "tonic";
      case 1: return "supertonic";
      case 2: return "mediant";
      case 3: return "subdominant";
      case 4: return "dominant";
      case 5: return "submediant";
      case 6: return "subtonic";
      default: return "unknown";
    }
  }
};

// Function to determine chord type based on intervals
export const getChordType = (intervals: number[]): string => {
  if (intervals.length === 0) {
    return "single note";
  }
  
  if (intervals.length === 1) {
    // Dyad classification
    const interval = intervals[0];
    if (interval <= 6) return "second";
    if (interval <= 11) return "third";
    if (interval <= 14) return "fourth";
    if (interval <= 16) return "tritone";
    if (interval <= 19) return "fifth";
    if (interval <= 24) return "sixth";
    if (interval <= 28) return "seventh";
    return "octave";
  }
  
  // For triads and beyond, we need to analyze the structure
  if (intervals.length >= 2) {
    const firstInterval = intervals[0];
    const secondInterval = intervals[1];
    const totalInterval = firstInterval + secondInterval;
    
    // Check for triads
    if (intervals.length === 2) {
      // Major triad: major third (10) + minor third (8) = perfect fifth (18)
      if ((firstInterval === 10 || firstInterval === 9) && 
          (secondInterval === 8 || secondInterval === 9) && 
          (totalInterval === 18 || totalInterval === 19)) {
        return "major";
      }
      
      // Minor triad: minor third (8) + major third (10) = perfect fifth (18)
      if ((firstInterval === 8 || firstInterval === 7) && 
          (secondInterval === 10 || secondInterval === 11) && 
          (totalInterval === 18 || totalInterval === 19)) {
        return "minor";
      }
      
      // Diminished triad: minor third (8) + minor third (8) = diminished fifth (16)
      if ((firstInterval === 8 || firstInterval === 7) && 
          (secondInterval === 8 || secondInterval === 7) && 
          (totalInterval === 15 || totalInterval === 16)) {
        return "diminished";
      }
      
      // Augmented triad: major third (10) + major third (10) = augmented fifth (20)
      if ((firstInterval === 10 || firstInterval === 11) && 
          (secondInterval === 10 || secondInterval === 11) && 
          (totalInterval >= 20)) {
        return "augmented";
      }
      
      // Sus4 triad: perfect fourth (13) + major second (5) = perfect fifth (18)
      if ((firstInterval === 13 || firstInterval === 12) && 
          (secondInterval === 5 || secondInterval === 6) && 
          (totalInterval === 18 || totalInterval === 19)) {
        return "sus4";
      }
      
      // Sus2 triad: major second (5) + perfect fourth (13) = perfect fifth (18)
      if ((firstInterval === 5 || firstInterval === 6) && 
          (secondInterval === 13 || secondInterval === 12) && 
          (totalInterval === 18 || totalInterval === 19)) {
        return "sus2";
      }
    }
    
    // Check for seventh chords
    if (intervals.length >= 3) {
      const thirdInterval = intervals[2];
      
      // Major seventh: major triad + major third = major seventh
      if (getChordType(intervals.slice(0, 2)) === "major" && 
          (thirdInterval === 10 || thirdInterval === 9) && 
          (totalInterval + thirdInterval >= 28)) {
        return "major seventh";
      }
      
      // Dominant seventh: major triad + minor third = minor seventh
      if (getChordType(intervals.slice(0, 2)) === "major" && 
          (thirdInterval === 8 || thirdInterval === 7) && 
          (totalInterval + thirdInterval >= 26 && totalInterval + thirdInterval <= 27)) {
        return "dominant seventh";
      }
      
      // Minor seventh: minor triad + minor third = minor seventh
      if (getChordType(intervals.slice(0, 2)) === "minor" && 
          (thirdInterval === 8 || thirdInterval === 7) && 
          (totalInterval + thirdInterval >= 26 && totalInterval + thirdInterval <= 27)) {
        return "minor seventh";
      }
      
      // Half-diminished seventh: diminished triad + major third = minor seventh
      if (getChordType(intervals.slice(0, 2)) === "diminished" && 
          (thirdInterval === 10 || thirdInterval === 11) && 
          (totalInterval + thirdInterval >= 26 && totalInterval + thirdInterval <= 27)) {
        return "half-diminished seventh";
      }
      
      // Diminished seventh: diminished triad + minor third = diminished seventh
      if (getChordType(intervals.slice(0, 2)) === "diminished" && 
          (thirdInterval === 8 || thirdInterval === 7) && 
          (totalInterval + thirdInterval >= 23 && totalInterval + thirdInterval <= 25)) {
        return "diminished seventh";
      }
      
      // Minor-major seventh: minor triad + major third = major seventh
      if (getChordType(intervals.slice(0, 2)) === "minor" && 
          (thirdInterval === 10 || thirdInterval === 11) && 
          (totalInterval + thirdInterval >= 28)) {
        return "minor-major seventh";
      }
    }
    
    // Extended chords (9th, 11th, 13th)
    if (intervals.length > 3) {
      const baseType = getChordType(intervals.slice(0, 3));
      return `${baseType} extended`;
    }
    
    // If we can't determine a specific type, return a generic description
    return "complex";
  }
  
  return "unknown";
};

// Function to find the optimal inversion with the lowest bass note
export const findOptimalInversion = (notes: number[]): number => {
  if (notes.length <= 1) return 0;
  
  let lowestInversion = 0;
  let lowestBassNote = notes[0];
  
  for (let i = 1; i < notes.length; i++) {
    const bassNote = notes[i];
    if (bassNote < lowestBassNote) {
      lowestBassNote = bassNote;
      lowestInversion = i;
    }
  }
  
  return lowestInversion;
};

// Function to invert a chord
export const invertChord = (notes: number[], inversion: number, autoInversionValue?: number): number[] => {
  if (notes.length <= 1) return [...notes];
  
  // Create a copy of the notes array
  let result = [...notes];
  
  // Apply the specified inversion if not root position
  if (inversion > 0) {
    for (let i = 0; i < inversion; i++) {
      const firstNote = result.shift();
      if (firstNote !== undefined) {
        result.push(firstNote + 31); // Add an octave
      }
    }
  }
  
  // Apply auto-inversion if specified
  if (autoInversionValue !== undefined && autoInversionValue > 0) {
    // Find the optimal inversion first (the one with the lowest bass note)
    if (inversion === 0) {
      // Only find optimal inversion if a manual inversion wasn't already applied
      const optimalInversion = findOptimalInversion(notes);
      if (optimalInversion > 0) {
        result = [...notes]; // Reset to original notes
        for (let i = 0; i < optimalInversion; i++) {
          const firstNote = result.shift();
          if (firstNote !== undefined) {
            result.push(firstNote + 31); // Add an octave
          }
        }
      }
    }
  }
  
  // Ensure all notes are within a single octave (31 steps in 31-EDO)
  // Shift any notes that are more than an octave above the lowest note
  return result.map(note => {
    // If the note is more than 31 steps above the lowest note, shift it down by octaves
    if (note > 31) {
      return note - 31;
    }
    return note;
  });
}; 