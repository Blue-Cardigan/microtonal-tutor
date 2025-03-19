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

// Improved interval classification helper functions for more flexible chord detection
const isMinorSecondLike = (interval: number): boolean => interval >= 2 && interval <= 4;
const isMajorSecondLike = (interval: number): boolean => interval >= 5 && interval <= 6;
const isMinorThirdLike = (interval: number): boolean => interval >= 7 && interval <= 9;
const isMajorThirdLike = (interval: number): boolean => interval >= 10 && interval <= 11;
const isPerfectFourthLike = (interval: number): boolean => interval >= 12 && interval <= 14;
const isPerfectFifthLike = (interval: number): boolean => interval >= 18 && interval <= 19;
const isMajorSixthLike = (interval: number): boolean => interval >= 23 && interval <= 24;
const isMinorSeventhLike = (interval: number): boolean => interval >= 25 && interval <= 27;
const isMajorSeventhLike = (interval: number): boolean => interval >= 28 && interval <= 30;

// Function to determine chord type based on intervals with improved flexibility for 31-EDO
export const getChordType = (intervals: number[]): string => {
  if (intervals.length === 0) {
    return "single note";
  }
  
  if (intervals.length === 1) {
    // Dyad classification with improved ranges
    const interval = intervals[0];
    if (interval <= 6) return "second";
    if (interval <= 11) return "third";
    if (interval <= 14) return "fourth";
    if (interval <= 17) return "tritone";
    if (interval <= 19) return "fifth";
    if (interval <= 24) return "sixth";
    if (interval <= 30) return "seventh";
    return "octave";
  }
  
  // For triads and beyond, analyze the structure with greater tolerance for microtonal differences
  if (intervals.length >= 2) {
    const firstInterval = intervals[0];
    const secondInterval = intervals[1];
    const totalInterval = firstInterval + secondInterval;
    
    // Triad classification with improved microtonal awareness
    if (intervals.length === 2) {
      // Check for major triad and variants
      if (isMajorThirdLike(firstInterval) && isMinorThirdLike(secondInterval) && 
          (totalInterval >= 17 && totalInterval <= 20)) {
        if (totalInterval > 19) return "augmented major";
        if (totalInterval < 18) return "diminished major";
        return "major";
      }
      
      // Check for minor triad and variants
      if (isMinorThirdLike(firstInterval) && isMajorThirdLike(secondInterval) && 
          (totalInterval >= 17 && totalInterval <= 20)) {
        if (totalInterval > 19) return "augmented minor";
        if (totalInterval < 18) return "diminished minor";
        return "minor";
      }
      
      // Check for diminished triad and variants
      if (isMinorThirdLike(firstInterval) && isMinorThirdLike(secondInterval)) {
        return "diminished";
      }
      
      // Check for augmented triad
      if (isMajorThirdLike(firstInterval) && isMajorThirdLike(secondInterval)) {
        return "augmented";
      }
      
      // Check for suspended triads
      if (isPerfectFourthLike(firstInterval) && isMajorSecondLike(secondInterval) && 
          (totalInterval >= 17 && totalInterval <= 20)) {
        return "sus4";
      }
      
      if (isMajorSecondLike(firstInterval) && isPerfectFourthLike(secondInterval) && 
          (totalInterval >= 17 && totalInterval <= 20)) {
        return "sus2";
      }
      
      // Check for quartal triads (built on fourths)
      if (isPerfectFourthLike(firstInterval) && isPerfectFourthLike(secondInterval)) {
        return "quartal";
      }
      
      // Check for neutral triads (specific to microtonal systems)
      if ((firstInterval === 9 || firstInterval === 10) && 
          (secondInterval === 9 || secondInterval === 10)) {
        return "neutral";
      }
      
      // Check for "hard" triads with seconds
      if (isMinorSecondLike(firstInterval) || isMinorSecondLike(secondInterval)) {
        return "secundal";
      }
      
      // Check for mixed interval triads
      const hasPerfectFifth = totalInterval >= 17 && totalInterval <= 19;
      if (hasPerfectFifth) {
        if (firstInterval <= 6 || secondInterval <= 6) return "quintal-secundal";
        if (isPerfectFourthLike(firstInterval) || isPerfectFourthLike(secondInterval)) {
          return "mixed quartal";
        }
      }
    }
    
    // Seventh chord classification with improved detection
    if (intervals.length >= 3) {
      const thirdInterval = intervals[2];
      const triadType = getChordType(intervals.slice(0, 2));
      const fullInterval = totalInterval + thirdInterval;
      
      // Major seventh family
      if (triadType === "major") {
        if (isMajorSeventhLike(fullInterval)) return "major seventh";
        if (isMinorSeventhLike(fullInterval)) return "dominant seventh";
        if (isMajorSixthLike(fullInterval)) return "major sixth";
        if (isPerfectFifthLike(thirdInterval)) return "major add11";
        if (isMajorSecondLike(thirdInterval)) return "major add9";
      }
      
      // Minor seventh family
      if (triadType === "minor") {
        if (isMajorSeventhLike(fullInterval)) return "minor-major seventh";
        if (isMinorSeventhLike(fullInterval)) return "minor seventh";
        if (isMajorSixthLike(fullInterval)) return "minor sixth";
        if (isPerfectFifthLike(thirdInterval)) return "minor add11";
        if (isMajorSecondLike(thirdInterval)) return "minor add9";
      }
      
      // Diminished seventh family
      if (triadType === "diminished") {
        if (isMinorSeventhLike(fullInterval)) return "half-diminished seventh";
        if (fullInterval >= 22 && fullInterval <= 25) return "diminished seventh";
        if (isMajorSixthLike(fullInterval)) return "diminished add sixth";
      }
      
      // Augmented seventh family
      if (triadType === "augmented") {
        if (isMajorSeventhLike(fullInterval)) return "augmented major seventh";
        if (isMinorSeventhLike(fullInterval)) return "augmented seventh";
        if (isMajorSixthLike(fullInterval)) return "augmented sixth";
      }
      
      // Suspended seventh chords
      if (triadType === "sus4" || triadType === "sus2") {
        if (isMinorSeventhLike(fullInterval)) return `${triadType} seventh`;
        if (isMajorSeventhLike(fullInterval)) return `${triadType} major seventh`;
      }
      
      // Special case for quartal chords extended
      if (triadType === "quartal" && isPerfectFourthLike(thirdInterval)) {
        return "extended quartal";
      }
      
      // Microtonal-specific seventh chords
      if (thirdInterval === 9) {
        return `${triadType} neutral seventh`;
      }
      
      // If we get here, but the triad type is known, use it as a base
      if (triadType !== "complex" && triadType !== "unknown") {
        return `${triadType} with extension`;
      }
    }
    
    // Extended chords (9th, 11th, 13th) with more specific naming
    if (intervals.length > 3) {
      const baseType = getChordType(intervals.slice(0, 3));
      const forthInterval = intervals[3];
      
      // If we have a recognizable seventh chord base
      if (baseType.includes("seventh") || baseType.includes("sixth")) {
        if (isMajorSecondLike(forthInterval)) return baseType.replace("seventh", "ninth").replace("sixth", "sixth-ninth");
        if (isPerfectFourthLike(forthInterval)) return baseType.replace("seventh", "eleventh");
        if (isMajorSixthLike(forthInterval)) return baseType.replace("seventh", "thirteenth");
        return `${baseType} extended`;
      }
      
      // Handle other extended chords generically but still descriptively
      if (baseType !== "complex" && baseType !== "unknown" && !baseType.includes("extension")) {
        return `${baseType} extended`;
      }
    }
    
    // Analyze the full interval structure for a more descriptive classification
    const hasThird = intervals.some(i => isMinorThirdLike(i) || isMajorThirdLike(i));
    const hasFifth = intervals.some(i => isPerfectFifthLike(i)) || 
                     (firstInterval + secondInterval >= 17 && firstInterval + secondInterval <= 19);
    const hasSeventh = intervals.some(i => isMinorSeventhLike(i) || isMajorSeventhLike(i)) ||
                        (totalInterval + intervals[2] >= 25 && totalInterval + intervals[2] <= 30);
    
    if (hasThird && hasFifth && hasSeventh) return "tertian seventh";
    if (hasThird && hasFifth) return "tertian";
    
    const hasSecond = intervals.some(i => isMinorSecondLike(i) || isMajorSecondLike(i));
    const hasFourth = intervals.some(i => isPerfectFourthLike(i));
    
    if (hasFourth && intervals.filter(i => isPerfectFourthLike(i)).length >= 2) return "quartal";
    if (hasFifth && intervals.filter(i => isPerfectFifthLike(i)).length >= 1) return "quintal";
    if (hasSecond && intervals.filter(i => isMinorSecondLike(i) || isMajorSecondLike(i)).length >= 2) return "cluster";
    
    // Last resort for truly complex chords, but with more information
    const intervalTypes = [];
    if (hasSecond) intervalTypes.push("seconds");
    if (hasThird) intervalTypes.push("thirds");
    if (hasFourth) intervalTypes.push("fourths");
    if (hasFifth) intervalTypes.push("fifths");
    if (hasSeventh) intervalTypes.push("sevenths");
    
    if (intervalTypes.length > 0) {
      return `mixed (${intervalTypes.join(", ")})`;
    }
  }
  
  return "mixed";
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
  if (inversion > 0 && inversion < notes.length) {
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
      if (optimalInversion > 0 && optimalInversion < notes.length) {
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
  
  // Move any notes above the octave (31) down an octave
  // This ensures all notes are within the 0-31 range
  return result.map(note => {
    if (note > 31) {
      // Properly handle octave reduction for all notes
      return ((note - 1) % 31) + 1;
    }
    return note;
  });
};