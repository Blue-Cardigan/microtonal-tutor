import fs from 'fs';

/**
 * 31-EDO Heptatonic Scale Generator
 * Generates all possible 7-note scales in 31-EDO by starting with 
 * hyperlydian and progressively flattening notes following the circle of fourths.
 * Includes naming, descriptions, and categorization.
 * Modified to enforce a minimum interval size of 2 steps to avoid tense/chromatic sounds.
 */

// Constants for 31-EDO system
const OCTAVE = 31; // Steps in an octave
// const FIFTH = 18; // A perfect fifth in 31-EDO is 18 steps

// Enumeration constants for categorization
const ACOUSTIC_PROPERTIES = {
  JUST: "Just Intonation Approximation",
  HARMONIC_SERIES: "Harmonic Series Approximation",
  EQUAL_SPACED: "Equal Spacing",
  CONSONANT: "Consonant",
  DISSONANT: "Dissonant"
};

const CULTURAL_REFERENCES = {
  WESTERN: "Western Classical",
  ARABIC: "Arabic/Middle Eastern",
  PERSIAN: "Persian",
  BALKAN: "Balkan",
  EAST_ASIAN: "East Asian",
  GAMELAN: "Gamelan",
  INDIAN: "Indian",
  AFRICAN: "African",
  MICROTONAL: "Microtonal Tradition",
  EXPERIMENTAL: "Experimental/Contemporary"
};

const PERCEPTUAL_CHARACTERS = {
  ULTRA_BRIGHT: "Ultra Bright",
  BRIGHT: "Bright",
  DARK: "Dark",
  ULTRA_DARK: "Ultra Dark",
  NEUTRAL: "Neutral",
  TENSE: "Tense",
  RELAXED: "Relaxed",
  AMBIGUOUS: "Ambiguous"
};

const MATHEMATICAL_PROPERTIES = {
  SYMMETRIC: "Symmetric",
  REFLECTIVE_SYM: "Reflective Symmetry",
  ROTATIONAL_SYM: "Rotational Symmetry",
  PRIME_CARDINALITY: "Prime Cardinality",
  SPARSE: "Sparse Intervals",
  DENSE: "Dense Intervals",
  EQUIPENTATONIC: "Equipentatonic",
  EQUIHEPTATONIC: "Equiheptatonic"
};

const GENERA = {
  DIATONIC: "Diatonic",
  CHROMATIC: "Chromatic",
  ENHARMONIC: "Enharmonic",
  NEUTRAL: "Neutral",
  MIXED: "Mixed"
};

const MODIFICATION_PATHS = {
  STANDARD: "standard",
  EXTENDED: "extended",
  ALTERNATIVE: "alternative"
};

// Microtonal naming components based on scale interval properties
const MICROTONAL_DESCRIPTORS = {
  SEPTAL: "Septal", // Approximates 7-limit intervals
  TERTIAL: "Tertial", // Emphasizes thirds relationships
  POLY: "Poly", // Many types of intervals
  HYPER: "Hyper", // Extra-bright variants
  HYPO: "Hypo", // Extra-dark variants
  QUASI: "Quasi", // Almost but not quite
  SUPER: "Super", // Enhanced version
  ULTRA: "Ultra", // Extreme version
  SEMI: "Semi", // Half-version
  HEMI: "Hemi", // Quarter-version
  DEMI: "Demi", // Reduced version
  PARA: "Para", // Alongside but different
  META: "Meta", // Beyond
  PROTO: "Proto", // First/primitive form
  NEO: "Neo", // New form
  EQUI: "Equi", // Equal distribution
  ANTI: "Anti", // Opposite
  BI: "Bi", // Dual nature
  TRI: "Tri", // Triple nature
  TRANS: "Trans", // Across/beyond
  MICRO: "Micro", // Small-interval focus
  MACRO: "Macro", // Large-interval focus
  MONO: "Mono" // Single-interval type
};

// Used to track all scale names to ensure uniqueness
const usedScaleNames = new Set();

/**
 * Generates all possible 7-note scales in 31-EDO by starting with 
 * the brightest valid scale and progressively flattening notes following the circle of fourths.
 * Maintains a minimum interval size of 2 steps to avoid tense chromatic intervals.
 */
function generateHeptatonicScales() {
  const scales = [];
  
  // Start with a true hyperlydian with wide intervals but adjusted to avoid 1-step intervals
  const baseScale = {
    degrees: [0, 6, 12, 17, 22, 27, 29, 31], // Very bright scale with minimum 2-step intervals
    intervals: [6, 6, 5, 5, 5, 2, 2],        // Intervals between consecutive notes
    name: "Hyperlydian",
    description: "The brightest valid heptatonic scale in 31-EDO, with maximally wide intervals while maintaining a minimum interval of 2 steps.",
    alterations: []
  };
  
  // Circle of fourths order for systematic flattening
  // In traditional music theory, we flatten following: F, Bb, Eb, Ab, Db, Gb, Cb
  // In scale degree indices (0-6): 3, 6, 2, 5, 1, 4, 0
  const flatteningOrder = [3, 6, 2, 5, 1, 4, 0];
  const degreeNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  
  // Add categories to the base scale
  baseScale.categories = categorizeScale(baseScale, null, MODIFICATION_PATHS.STANDARD);
  
  // Add the Hyperlydian name to used names set
  usedScaleNames.add(baseScale.name);
  scales.push(JSON.parse(JSON.stringify(baseScale)));
  
  // Current scale to modify
  let currentScale = JSON.parse(JSON.stringify(baseScale));
  
  // Track all generated scale patterns to avoid duplicates
  const generatedPatterns = new Set();
  generatedPatterns.add(baseScale.intervals.join(','));
  
  // Generate all possible scales by progressively flattening notes
  for (let i = 0; i < flatteningOrder.length; i++) {
    // Reset to current position in the flattening sequence
    currentScale = i === 0 ? 
      JSON.parse(JSON.stringify(baseScale)) : 
      JSON.parse(JSON.stringify(scales[scales.length - 1]));
      
    for (let j = 0; j < 5; j++) { // Each note can be flattened multiple times
      const degreeToFlatten = flatteningOrder[i];
      
      // Skip if flattening would create an invalid interval
      // Check interval from previous degree to current degree
      const prevDegree = (degreeToFlatten - 1 + 7) % 7;
      // If current degree is 0, we need to check the interval from the 7th to the 1st (wrapped)
      const prevInterval = currentScale.intervals[prevDegree];
      
      // Check interval from current degree to next degree
      const nextInterval = currentScale.intervals[degreeToFlatten];
      
      // MODIFIED: Set minimum interval to 2 to avoid tense/chromatic intervals
      if (prevInterval <= 2 || nextInterval <= 2) break;
      
      // Create a new scale object for this alteration
      const newScale = JSON.parse(JSON.stringify(currentScale));
      
      // Flatten the note (always keeping degree 0 at position 0)
      newScale.degrees[degreeToFlatten]--;
      
      // Update intervals between consecutive notes
      recalculateIntervals(newScale);
      
      // ADDITIONAL CHECK: Skip if any interval becomes less than 2
      if (newScale.intervals.some(interval => interval < 2)) {
        break;
      }
      
      // Skip if we've already generated this interval pattern
      const intervalPattern = newScale.intervals.join(',');
      if (generatedPatterns.has(intervalPattern)) {
        break;
      }
      generatedPatterns.add(intervalPattern);
      
      // Track the alteration
      const stepsFlatted = j + 1;
      newScale.alterations.push({
        degree: degreeToFlatten,
        degreeName: degreeNames[degreeToFlatten],
        steps: stepsFlatted
      });
      
      // Generate unique name with structural hints
      const namingInfo = generateEnhancedScaleName(newScale);
      newScale.name = namingInfo.name;
      newScale.description = generateDescription(newScale);
      
      // Add categories
      newScale.categories = categorizeScale(newScale, baseScale, MODIFICATION_PATHS.STANDARD);
      
      // Add to scales collection
      scales.push(JSON.parse(JSON.stringify(newScale)));
      
      // Update current scale for next iteration
      currentScale = JSON.parse(JSON.stringify(newScale));
    }
  }
  
  // Add rotational modes of each scale
  // This ensures we generate all modes of each unique scale structure
  const modesCollection = [];
  const uniqueIntervalSets = new Set();
  
  scales.forEach(scale => {
    // Skip if we've already processed this interval pattern
    const intervalKey = scale.intervals.join(',');
    if (uniqueIntervalSets.has(intervalKey)) return;
    uniqueIntervalSets.add(intervalKey);
    
    // Generate all 7 modes for this scale
    for (let rotation = 0; rotation < 7; rotation++) {
      if (rotation === 0) {
        // The original scale is already in our collection
        modesCollection.push(scale);
        continue;
      }
      
      // Create rotated scale
      const rotatedScale = JSON.parse(JSON.stringify(scale));
      
      // Rotate intervals
      rotatedScale.intervals = [
        ...scale.intervals.slice(rotation),
        ...scale.intervals.slice(0, rotation)
      ];
      
      // Recalculate degrees
      rotatedScale.degrees = [0];
      for (let i = 0; i < 7; i++) {
        rotatedScale.degrees.push(
          rotatedScale.degrees[i] + rotatedScale.intervals[i]
        );
      }
      
      // Generate unique mode name with structural hints
      const rotatedNamingInfo = generateUniqueModeNameFromRotation(scale, rotation);
      rotatedScale.name = rotatedNamingInfo.name;
      rotatedScale.description = `${rotation}th mode of ${scale.name}. ${rotatedNamingInfo.description}`;
      
      // Update alterations to reflect this is a mode
      rotatedScale.alterations = [{
        type: "mode",
        from: scale.name,
        rotation
      }];
      
      // Update categories
      rotatedScale.categories = categorizeScale(rotatedScale, baseScale, MODIFICATION_PATHS.STANDARD);
      
      // Add to collection
      modesCollection.push(rotatedScale);
    }
  });
  
  return modesCollection;
}

/**
 * Helper function to recalculate intervals after a note is flattened
 * Ensures that intervals correctly wrap around the octave
 */
function recalculateIntervals(scale) {
  const degrees = scale.degrees;
  
  for (let i = 0; i < 7; i++) {
    const nextIndex = (i + 1) % 8; // Use modulo 8 to include octave when needed
    let interval;
    
    if (nextIndex === 7) {
      // For the last interval, calculate to the octave
      interval = degrees[7] - degrees[i];
    } else {
      interval = degrees[nextIndex] - degrees[i];
    }
    
    // Ensure positive interval (should always be the case if starting from brightest)
    if (interval <= 0) {
      console.warn("Negative interval detected:", interval, "at position", i);
      interval += OCTAVE;
    }
    
    scale.intervals[i] = interval;
  }
}

/**
 * Generate unique mode names with structural hints
 */
function generateUniqueModeNameFromRotation(parentScale, rotation) {
  // Traditional mode names based on rotation (for diatonic scales)
  const traditionalModeNames = [
    "Ionian", "Dorian", "Phrygian", "Lydian", 
    "Mixolydian", "Aeolian", "Locrian"
  ];
  
  // Check if the parent is close to a diatonic scale
  const isDiatonic = parentScale.intervals.filter(i => 
    i === 5 || i === 3
  ).length >= 5;
  
  let baseName;
  let description;
  
  if (isDiatonic) {
    // Use traditional mode names as base
    baseName = traditionalModeNames[rotation];
    description = `Traditional ${baseName} mode structure.`;
  } else {
    // Create a descriptive name based on the character of the mode
    const averageInterval = parentScale.intervals.reduce((a, b) => a + b, 0) / 7;
    const smallIntervals = parentScale.intervals.filter(i => i <= 3).length;
    const largeIntervals = parentScale.intervals.filter(i => i >= 5).length;
    
    // Determine brightness/darkness
    let character;
    if (averageInterval > 4.8) character = "Bright";
    else if (averageInterval > 4.3) character = "Neutral";
    else if (averageInterval > 3.8) character = "Mild";
    else character = "Dark";
    
    // Add tension descriptor
    let tension;
    if (parentScale.intervals.includes(6)) {
      tension = "Open";
    } else if (smallIntervals >= 4) {
      tension = "Dense";
    } else if (largeIntervals >= 5) {
      tension = "Wide";
    } else {
      tension = "Balanced";
    }
    
    // Use the closest traditional mode as a reference point
    let closestMode = getClosestTraditionalMode(parentScale.intervals, rotation);
    
    baseName = `${character} ${tension} ${closestMode}`;
    description = `A ${character.toLowerCase()}, ${tension.toLowerCase()} mode derived from ${parentScale.name}.`;
  }
  
  // Add structural descriptors based on interval patterns
  const structuralDescriptors = generateStructuralDescriptors(parentScale.intervals);
  
  // Combine name with structural descriptors
  let fullName = "";
  if (structuralDescriptors.length > 0) {
    // Use just one or two structural descriptors to keep names manageable
    const limitedDescriptors = structuralDescriptors.slice(0, Math.min(2, structuralDescriptors.length));
    fullName = `${limitedDescriptors.join("")} ${baseName}`;
  } else {
    fullName = `Modified ${baseName}`;
  }
  
  // Ensure uniqueness by adding a suffix if necessary
  let uniqueName = fullName;
  let suffix = 2;
  while (usedScaleNames.has(uniqueName)) {
    uniqueName = `${fullName} ${suffix}`;
    suffix++;
  }
  
  // Register the name as used
  usedScaleNames.add(uniqueName);
  
  return { name: uniqueName, description };
}

/**
 * Determines the closest traditional mode for a given interval pattern
 */
function getClosestTraditionalMode(intervals, rotation) {
  // Traditional mode interval patterns
  const traditionalModes = [
    { name: "Ionian", pattern: [5, 3, 5, 5, 3, 5, 5] },
    { name: "Dorian", pattern: [3, 5, 5, 3, 5, 5, 5] },
    { name: "Phrygian", pattern: [5, 5, 3, 5, 5, 5, 3] },
    { name: "Lydian", pattern: [5, 5, 5, 3, 5, 5, 3] },
    { name: "Mixolydian", pattern: [5, 5, 3, 5, 5, 3, 5] },
    { name: "Aeolian", pattern: [5, 3, 5, 5, 3, 5, 5] },
    { name: "Locrian", pattern: [3, 5, 5, 3, 5, 5, 5] }
  ];
  
  // Rotated input intervals for comparison
  const rotatedIntervals = [
    ...intervals.slice(rotation),
    ...intervals.slice(0, rotation)
  ];
  
  // Find closest match
  let closestMode = "Ionian"; // default
  let smallestDifference = Infinity;
  
  for (const mode of traditionalModes) {
    let difference = 0;
    for (let i = 0; i < 7; i++) {
      difference += Math.abs(rotatedIntervals[i] - mode.pattern[i]);
    }
    
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestMode = mode.name;
    }
  }
  
  return closestMode;
}

/**
 * Generate structural descriptors based on scale intervals
 */
function generateStructuralDescriptors(intervals) {
  const descriptors = [];
  
  // Count interval types
  const counts = {
    "2": intervals.filter(i => i === 2).length,
    "3": intervals.filter(i => i === 3).length,
    "4": intervals.filter(i => i === 4).length,
    "5": intervals.filter(i => i === 5).length,
    "6": intervals.filter(i => i === 6).length,
    "7+": intervals.filter(i => i >= 7).length
  };
  
  // Analyze interval distribution for specific characteristics
  
  // Septal (related to 7-limit harmony)
  if (intervals.some(i => [10, 17, 24].includes(i))) {
    descriptors.push(MICROTONAL_DESCRIPTORS.SEPTAL);
  }
  
  // Tertial (emphasis on thirds)
  if ((counts["3"] + counts["4"]) >= 3) {
    descriptors.push(MICROTONAL_DESCRIPTORS.TERTIAL);
  }
  
  // Poly (many different interval types)
  if (new Set(intervals).size >= 5) {
    descriptors.push(MICROTONAL_DESCRIPTORS.POLY);
  }
  
  // Equi (equal distribution)
  if (new Set(intervals).size <= 2) {
    descriptors.push(MICROTONAL_DESCRIPTORS.EQUI);
  }
  
  // Micro (small intervals)
  if (counts["2"] >= 3) {
    descriptors.push(MICROTONAL_DESCRIPTORS.MICRO);
  }
  
  // Macro (large intervals)
  if (counts["6"] + counts["7+"] >= 2) {
    descriptors.push(MICROTONAL_DESCRIPTORS.MACRO);
  }
  
  // Neutral (neutral intervals)
  if (counts["4"] >= 2) {
    descriptors.push(MICROTONAL_DESCRIPTORS.QUASI);
  }
  
  // Bi (dual nature - strong contrast between interval types)
  if (counts["2"] >= 2 && counts["6"] >= 1) {
    descriptors.push(MICROTONAL_DESCRIPTORS.BI);
  }
  
  // Tri (three different interval types in significant numbers)
  const significantTypes = Object.keys(counts).filter(key => counts[key] >= 2).length;
  if (significantTypes === 3) {
    descriptors.push(MICROTONAL_DESCRIPTORS.TRI);
  }
  
  // Mono (dominated by one interval type)
  Object.keys(counts).forEach(key => {
    if (counts[key] >= 5) {
      descriptors.push(MICROTONAL_DESCRIPTORS.MONO);
    }
  });
  
  // Hyper/Hypo (extreme brightness/darkness)
  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  if (avgInterval > 5) {
    descriptors.push(MICROTONAL_DESCRIPTORS.HYPER);
  } else if (avgInterval < 3) {
    descriptors.push(MICROTONAL_DESCRIPTORS.HYPO);
  }
  
  return descriptors;
}

/**
 * Enhanced function to generate unique scale names with structural hints
 */
function generateEnhancedScaleName(scale) {
  // Check for exact matches to basic scales
  if (arrayEquals(scale.intervals, [5, 5, 5, 5, 5, 3, 3])) {
    return { 
      name: "Hyperlydian",
      baseMode: "Lydian",
      modifiers: ["Hyper"]
    };
  }
  
  // Basic diatonic patterns for reference
  const diatonicPatterns = [
    { pattern: [5, 5, 3, 5, 5, 5, 3], name: "Lydian" },
    { pattern: [5, 3, 5, 5, 5, 3, 5], name: "Ionian" },
    { pattern: [3, 5, 5, 5, 3, 5, 5], name: "Mixolydian" },
    { pattern: [5, 5, 5, 3, 5, 5, 3], name: "Dorian" },
    { pattern: [5, 5, 3, 5, 5, 3, 5], name: "Aeolian" },
    { pattern: [5, 3, 5, 5, 3, 5, 5], name: "Phrygian" },
    { pattern: [3, 5, 5, 3, 5, 5, 5], name: "Locrian" }
  ];
  
  // Check for exact diatonic matches
  for (const mode of diatonicPatterns) {
    if (arrayEquals(scale.intervals, mode.pattern)) {
      // Add name to used names set
      usedScaleNames.add(mode.name);
      return { 
        name: mode.name,
        baseMode: mode.name,
        modifiers: []
      };
    }
  }
  
  // Find the closest diatonic mode
  let closestMode = null;
  let smallestDifference = Infinity;
  
  for (const mode of diatonicPatterns) {
    let difference = 0;
    for (let i = 0; i < 7; i++) {
      difference += Math.abs(scale.intervals[i] - mode.pattern[i]);
    }
    
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestMode = mode.name;
    }
  }
  
  // Generate modifiers based on interval characteristics
  const structuralDescriptors = generateStructuralDescriptors(scale.intervals);
  
  // Create composite name
  const effectiveDescriptors = structuralDescriptors.slice(0, Math.min(2, structuralDescriptors.length));
  
  let compositeName;
  if (effectiveDescriptors.length > 0) {
    compositeName = effectiveDescriptors.join("") + " " + closestMode;
  } else {
    compositeName = "Modified " + closestMode;
  }
  
  // Add degree alteration information for further uniqueness
  const significantAlterations = scale.alterations.filter(alt => alt.steps >= 2);
  if (significantAlterations.length > 0) {
    // Sort alterations by degree
    significantAlterations.sort((a, b) => a.degree - b.degree);
    
    // Add most significant alteration to name
    const mainAlteration = significantAlterations[0];
    const alterationText = `${mainAlteration.degreeName.substring(0, 3)}↓${mainAlteration.steps}`;
    
    compositeName += ` (${alterationText})`;
  }
  
  // Ensure uniqueness
  let uniqueName = compositeName;
  let suffix = 2;
  while (usedScaleNames.has(uniqueName)) {
    uniqueName = `${compositeName} ${suffix}`;
    suffix++;
  }
  
  // Add name to used names set
  usedScaleNames.add(uniqueName);
  
  return {
    name: uniqueName,
    baseMode: closestMode,
    modifiers: effectiveDescriptors
  };
}

// Function to generate detailed description of how the scale has been altered
function generateDescription(scale) {
  if (scale.alterations.length === 0) {
    return "Original hyperlydian scale with no alterations. All intervals are at least 2 steps to avoid tense chromatic sounds.";
  }
  
  // Group alterations by degree
  const alterationsByDegree = {};
  for (const alt of scale.alterations) {
    if (!alterationsByDegree[alt.degree]) {
      alterationsByDegree[alt.degree] = alt.steps;
    } else if (alt.steps > alterationsByDegree[alt.degree]) {
      alterationsByDegree[alt.degree] = alt.steps;
    }
  }
  
  // Build description
  let description = "Derived from hyperlydian by";
  const alterationDescriptions = [];
  
  for (const degree in alterationsByDegree) {
    const steps = alterationsByDegree[degree];
    const degreeName = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][parseInt(degree)];
    
    // Describe the flattening with musical terminology
    let term;
    if (steps === 1) term = "lowering";
    else if (steps === 2) term = "flattening";
    else if (steps === 3) term = "diminishing";
    else if (steps === 4) term = "severely diminishing";
    else term = "maximally diminishing";
    
    alterationDescriptions.push(`${term} the ${degreeName} degree by ${steps} step${steps !== 1 ? 's' : ''}`);
  }
  
  // Connect the alterations with appropriate punctuation
  if (alterationDescriptions.length === 1) {
    description += " " + alterationDescriptions[0] + ".";
  } else if (alterationDescriptions.length === 2) {
    description += " " + alterationDescriptions.join(" and ") + ".";
  } else {
    const lastAlteration = alterationDescriptions.pop();
    description += " " + alterationDescriptions.join(", ") + ", and " + lastAlteration + ".";
  }
  
  // Add analysis of resulting characteristics
  const intervalCounts = {};
  for (const interval of scale.intervals) {
    intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
  }
  
  const uniqueIntervals = Object.keys(intervalCounts).length;
  if (uniqueIntervals <= 2) {
    description += " Results in a scale with high interval uniformity.";
  } else if (uniqueIntervals >= 5) {
    description += " Results in a scale with highly varied intervals.";
  }
  
  // Mention notable interval patterns
  if (intervalCounts["2"] && intervalCounts["2"] >= 2) {
    description += " Contains multiple whole-tone intervals.";
  } else if (intervalCounts["6"] && intervalCounts["6"] >= 1) {
    description += " Contains augmented intervals.";
  }
  
  description += " All intervals are at least 2 steps to avoid chromatic tension.";
  
  return description;
}

/**
 * Categorizes a scale based on its properties
 * @param {Object} scale - The scale to categorize
 * @param {Object} baseScale - The base scale it was derived from
 * @param {String} modPath - The modification path followed
 * @returns {Object} Categories for the scale
 */
function categorizeScale(scale, baseScale, modPath) {
  const categories = {
    acoustic: [],
    cultural: [],
    perceptual: [],
    mathematical: [],
    genera: []
  };
  
  // ACOUSTIC/HARMONIC PROPERTIES
  
  // Check for just intonation approximation
  const justIntervals = [5, 8, 13, 18]; // Approximate 3:2, 5:4, 4:3, etc.
  let justCount = 0;
  for (const interval of scale.intervals) {
    if (justIntervals.includes(interval)) justCount++;
  }
  if (justCount >= 4) {
    categories.acoustic.push(ACOUSTIC_PROPERTIES.JUST);
  }
  
  // Check for harmonic series approximation
  // 31edo can approximate harmonics 7-16 well
  let harmonicCount = 0;
  for (let i = 0; i < scale.degrees.length; i++) {
    const degree = scale.degrees[i];
    if ([10, 18, 24, 28].includes(degree)) { // approximate harmonic positions
      harmonicCount++;
    }
  }
  if (harmonicCount >= 3) {
    categories.acoustic.push(ACOUSTIC_PROPERTIES.HARMONIC_SERIES);
  }
  
  // Check for equal spacing
  const uniqueIntervals = new Set(scale.intervals);
  if (uniqueIntervals.size <= 2) {
    categories.acoustic.push(ACOUSTIC_PROPERTIES.EQUAL_SPACED);
  }
  
  // Consonance check
  const consonantIntervals = [18, 13, 10, 8]; // 5th, 4th, maj 3rd, min 3rd
  const dissonantIntervals = [2, 6, 17, 16]; // whole-tone, tritone variants (removed semitone)
  
  let consonantCount = 0;
  let dissonantCount = 0;
  
  for (const interval of scale.intervals) {
    if (consonantIntervals.includes(interval)) consonantCount++;
    if (dissonantIntervals.includes(interval)) dissonantCount++;
  }
  
  if (consonantCount >= 5) categories.acoustic.push(ACOUSTIC_PROPERTIES.CONSONANT);
  if (dissonantCount >= 3) categories.acoustic.push(ACOUSTIC_PROPERTIES.DISSONANT);
  
  // CULTURAL/HISTORICAL REFERENCES
  
  // Western classification
  if (baseScale && modPath && baseScale.name === "Hyperlydian" && modPath === MODIFICATION_PATHS.STANDARD) {
    categories.cultural.push(CULTURAL_REFERENCES.WESTERN);
  }
  
  // Middle Eastern / Arabic classification
  const neutralSeconds = scale.intervals.filter(i => i === 4).length;
  const neutralThirds = scale.intervals.filter(i => i === 9).length;
  
  if (neutralSeconds >= 1 && neutralThirds >= 1) {
    categories.cultural.push(CULTURAL_REFERENCES.ARABIC);
    
    // More specific Persian influence
    if (scale.intervals.includes(6)) {
      categories.cultural.push(CULTURAL_REFERENCES.PERSIAN);
    }
  }
  
  // Balkan influence
  if (scale.intervals.includes(6) && scale.intervals.includes(4)) {
    categories.cultural.push(CULTURAL_REFERENCES.BALKAN);
  }
  
  // East Asian influence
  const hasGapped = scale.intervals.includes(8) && scale.intervals.includes(5);
  if (hasGapped && scale.degrees.length <= 8) { // Counting octave
    categories.cultural.push(CULTURAL_REFERENCES.EAST_ASIAN);
  }
  
  // Gamelan approximation
  // Pelog-like intervals
  const pelogLike = [2, 5, 5, 2, 5];
  let pelogMatch = 0;
  for (let i = 0; i < Math.min(pelogLike.length, scale.intervals.length); i++) {
    if (Math.abs(scale.intervals[i] - pelogLike[i]) <= 1) pelogMatch++;
  }
  if (pelogMatch >= 4) {
    categories.cultural.push(CULTURAL_REFERENCES.GAMELAN);
  }

  // Add Indian music detection
  const hasQuarterTones = scale.intervals.includes(3) && 
    (scale.intervals.includes(9) || scale.intervals.includes(4));
  const hasPerfectFifth = scale.intervals.includes(18);

  if (hasQuarterTones && hasPerfectFifth && scale.degrees.length >= 7) {
    categories.cultural.push(CULTURAL_REFERENCES.INDIAN);
  }

  // Add African music detection (focusing on common patterns in certain traditions)
  const hasPentatonicStructure = scale.degrees.length === 8 && // 7 notes + octave
    scale.intervals.filter(i => i >= 5).length >= 4; // Several larger steps
  const hasEquidistantIntervals = new Set(scale.intervals).size <= 2;

  if (hasPentatonicStructure && hasEquidistantIntervals) {
    categories.cultural.push(CULTURAL_REFERENCES.AFRICAN);
  }

  // Explicit microtonal tradition detection
  const hasUncommonIntervals = scale.intervals.some(i => 
    [2, 4, 6, 7, 9, 11, 14, 16, 17, 19].includes(i)
  );
  const explicitlyMicrotonal = hasUncommonIntervals && 
    !categories.cultural.includes(CULTURAL_REFERENCES.WESTERN);

  if (explicitlyMicrotonal) {
    categories.cultural.push(CULTURAL_REFERENCES.MICROTONAL);
  }
  
  // Experimental/Contemporary
  if (dissonantCount >= 4) {
    categories.cultural.push(CULTURAL_REFERENCES.EXPERIMENTAL);
  }
  
  // PERCEPTUAL/EMOTIONAL CHARACTER
  
  // Brightness spectrum
  const smallIntervals = scale.intervals.filter(i => i <= 3).length;
  const largeIntervals = scale.intervals.filter(i => i >= 5).length;
  const averageInterval = scale.intervals.reduce((sum, val) => sum + val, 0) / scale.intervals.length;
  
  if (averageInterval > 5 && largeIntervals >= 5) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.ULTRA_BRIGHT);
  } else if (averageInterval > 4.5) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.BRIGHT);
  } else if (averageInterval < 3.5 && smallIntervals >= 4) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.ULTRA_DARK);
  } else if (averageInterval < 4) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.DARK);
  } else {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.NEUTRAL);
  }
  
  // Tension assessment - modified to remove references to single-step intervals
  if (dissonantCount >= 3) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.TENSE);
  } else if (consonantCount >= 5) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.RELAXED);
  }
  
  // Ambiguity assessment
  if (neutralSeconds + neutralThirds >= 3) {
    categories.perceptual.push(PERCEPTUAL_CHARACTERS.AMBIGUOUS);
  }
  
  // MATHEMATICAL/STRUCTURAL PROPERTIES
  
  // Symmetry check
  let isSymmetric = true;
  const halfLength = Math.floor(scale.intervals.length / 2);
  
  for (let i = 0; i < halfLength; i++) {
    if (scale.intervals[i] !== scale.intervals[scale.intervals.length - 1 - i]) {
      isSymmetric = false;
      break;
    }
  }
  
  if (isSymmetric) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.SYMMETRIC);
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.REFLECTIVE_SYM);
  }
  
  // Rotational symmetry
  const uniqueRotations = new Set();
  for (let i = 0; i < scale.intervals.length; i++) {
    const rotated = [...scale.intervals.slice(i), ...scale.intervals.slice(0, i)].join('-');
    uniqueRotations.add(rotated);
  }
  
  if (uniqueRotations.size < scale.intervals.length) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.ROTATIONAL_SYM);
  }
  
  // Cardinality properties
  const cardinality = scale.degrees.length - 1; // Exclude octave
  if (isPrime(cardinality)) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.PRIME_CARDINALITY);
  }
  
  // Interval density/sparsity
  const uniqueIntervalCount = new Set(scale.intervals).size;
  if (uniqueIntervalCount <= 2) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.SPARSE);
  } else if (uniqueIntervalCount >= 5) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.DENSE);
  }
  
  // Check for equal divisions
  if (cardinality === 5 && new Set(scale.intervals).size <= 2) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.EQUIPENTATONIC);
  } else if (cardinality === 7 && new Set(scale.intervals).size <= 2) {
    categories.mathematical.push(MATHEMATICAL_PROPERTIES.EQUIHEPTATONIC);
  }
  
  // GENERA CLASSIFICATION
  
  // Count intervals by type
  const diatonicIntervals = scale.intervals.filter(i => i === 5 || i === 3).length;
  const chromaticIntervals = scale.intervals.filter(i => i === 3 || i === 2).length;
  const enharmonicIntervals = scale.intervals.filter(i => i === 2).length; // Removed reference to 1-step intervals
  const neutralIntervals = scale.intervals.filter(i => i === 4 || i === 9 || i === 17).length;
  
  // Assign genera based on predominance
  if (diatonicIntervals >= 5) {
    categories.genera.push(GENERA.DIATONIC);
  } else if (chromaticIntervals >= 3) {
    categories.genera.push(GENERA.CHROMATIC);
  } else if (enharmonicIntervals >= 2) {
    categories.genera.push(GENERA.ENHARMONIC);
  } else if (neutralIntervals >= 3) {
    categories.genera.push(GENERA.NEUTRAL);
  } else {
    categories.genera.push(GENERA.MIXED);
  }
  
  return categories;
}

/**
 * Helper function to check if a number is prime
 * @param {number} num - Number to check
 * @returns {boolean} True if the number is prime
 */
function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  
  return true;
}

// Helper function to compare arrays
function arrayEquals(a, b) {
  return Array.isArray(a) && 
         Array.isArray(b) && 
         a.length === b.length && 
         a.every((val, index) => val === b[index]);
}

// Run the generation and print sample scales
const allScales = generateHeptatonicScales();
console.log(`Generated ${allScales.length} heptatonic scales in 31-EDO`);
console.log("\nFirst 3 scales:");
allScales.slice(0, 3).forEach((scale, index) => {
  console.log(`Scale ${index + 1}: ${scale.name}`);
  console.log(`Description: ${scale.description}`);
  console.log(`Degrees: [${scale.degrees.join(", ")}]`);
  console.log(`Intervals: [${scale.intervals.join(", ")}]`);
  console.log("Categories:");
  for (const category in scale.categories) {
    console.log(`  ${category}: ${scale.categories[category].join(", ")}`);
  }
  console.log("---");
});

console.log("\nLast 3 scales:");
allScales.slice(-3).forEach((scale, index) => {
  console.log(`Scale ${allScales.length - 3 + index + 1}: ${scale.name}`);
  console.log(`Description: ${scale.description}`);
  console.log(`Degrees: [${scale.degrees.join(", ")}]`);
  console.log(`Intervals: [${scale.intervals.join(", ")}]`);
  console.log("Categories:");
  for (const category in scale.categories) {
    console.log(`  ${category}: ${scale.categories[category].join(", ")}`);
  }
  console.log("---");
});

// Export the scales as JSON
console.log(JSON.stringify(allScales, null, 2));
fs.writeFileSync('public/data/modes.json', JSON.stringify(allScales, null, 2));