import fs from 'fs';

/**
 * 31-EDO Heptatonic Scale Generator
 * Generates all possible 7-note scales in 31-EDO by starting with 
 * hyperlydian and progressively flattening notes following the circle of fourths.
 * Includes naming, descriptions, and categorization.
 */

// Constants for 31-EDO system
const OCTAVE = 31; // Steps in an octave
const FIFTH = 18; // A perfect fifth in 31-EDO is 18 steps

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

// Function to generate all heptatonic scales in 31-EDO
function generateHeptatonicScales() {
  const scales = [];
  
  // We'll use the diatonic pattern as our baseline (5 + 5 + 3 + 5 + 5 + 5 + 3 = 31 steps)
  // But start with hyperlydian which has all notes raised to their maximum
  const baseScale = {
    degrees: [0, 5, 10, 13, 18, 23, 28, 31], // Starting with hyperlydian (including octave)
    intervals: [5, 5, 3, 5, 5, 5, 3],        // Intervals between consecutive notes
    name: "Hyperlydian",
    description: "Original hyperlydian scale with maximum brightness, no alterations.",
    alterations: []
  };
  
  // Circle of fourths/fifths order (for flattening)
  // In the circle of fifths, we progress: C G D A E B F# C# G# D# A# F
  // For flattening, we go in reverse (circle of fourths): C F Bb Eb Ab Db Gb/F# B E A D G
  // But we'll use scale degree indices (0-6) rather than note names
  const flatteningOrder = [0, 3, 6, 2, 5, 1, 4]; // Corresponds to C F Bb... in scale degrees
  const degreeNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  
  // Add categories to the base scale
  baseScale.categories = categorizeScale(baseScale, null, MODIFICATION_PATHS.STANDARD);
  scales.push(JSON.parse(JSON.stringify(baseScale)));
  
  // Current scale to modify
  let currentScale = JSON.parse(JSON.stringify(baseScale));
  
  // Generate all possible scales by progressively flattening notes
  for (let i = 0; i < flatteningOrder.length; i++) {
    for (let j = 0; j < 5; j++) { // Each note can be flattened up to 5 times in 31-EDO
      const degreeToFlatten = flatteningOrder[i];
      
      // Skip if we would create an interval of 0 or negative
      const prevDegree = (degreeToFlatten - 1 + 7) % 7; // Wrap around to 6 if degreeToFlatten is 0
      const interval = currentScale.intervals[prevDegree];
      
      if (interval <= 1) break; // Can't flatten anymore in this position
      
      // Create a new scale object for this alteration
      const newScale = JSON.parse(JSON.stringify(currentScale));
      
      // Flatten the note
      newScale.degrees[degreeToFlatten]--;
      
      // Update intervals
      recalculateIntervals(newScale);
      
      // Track the alteration
      const stepsFlatted = j + 1;
      newScale.alterations.push({
        degree: degreeToFlatten,
        degreeName: degreeNames[degreeToFlatten],
        steps: stepsFlatted
      });
      
      // Generate name, description
      const namingInfo = generateScaleName(newScale, baseScale);
      newScale.name = namingInfo.name;
      newScale.description = generateDescription(newScale, baseScale);
      
      // Add categories
      newScale.categories = categorizeScale(newScale, baseScale, MODIFICATION_PATHS.STANDARD);
      
      // Add to scales collection
      scales.push(JSON.parse(JSON.stringify(newScale)));
      
      // Update current scale for next iteration
      currentScale = JSON.parse(JSON.stringify(newScale));
    }
  }
  
  return scales;
}

// Helper function to recalculate intervals after a note is flattened
function recalculateIntervals(scale) {
  const degrees = scale.degrees;
  
  for (let i = 0; i < 7; i++) {
    const nextIndex = (i + 1) % 7;
    let interval = degrees[nextIndex] - degrees[i];
    if (interval <= 0) interval += OCTAVE; // Wrap around to the next octave
    
    scale.intervals[i] = interval;
  }
}

// Function to generate scale names based on interval patterns
function generateScaleName(scale, baseScale) {
  // Basic scale type identification based on patterns
  // Format: [modifier][root mode name]
  
  // Check for diatonic modes (major/minor scale family)
  const diatonicPatterns = [
    { pattern: [5, 5, 3, 5, 5, 5, 3], name: "Lydian" },
    { pattern: [5, 3, 5, 5, 5, 3, 5], name: "Ionian" },
    { pattern: [3, 5, 5, 5, 3, 5, 5], name: "Mixolydian" },
    { pattern: [5, 5, 5, 3, 5, 5, 3], name: "Dorian" },
    { pattern: [5, 5, 3, 5, 5, 3, 5], name: "Aeolian" },
    { pattern: [5, 3, 5, 5, 3, 5, 5], name: "Phrygian" },
    { pattern: [3, 5, 5, 3, 5, 5, 5], name: "Locrian" }
  ];
  
  // Special case for hyperlydian
  if (arrayEquals(scale.intervals, [5, 5, 3, 5, 5, 5, 3])) {
    return { 
      name: "Hyperlydian",
      baseMode: "Lydian",
      modifiers: ["Hyper"]
    };
  }
  
  // Check for exact diatonic matches
  for (const mode of diatonicPatterns) {
    if (arrayEquals(scale.intervals, mode.pattern)) {
      return { 
        name: mode.name,
        baseMode: mode.name,
        modifiers: []
      };
    }
  }
  
  // Count the number of different interval types
  const counts = {
    "1": scale.intervals.filter(i => i === 1).length,
    "2": scale.intervals.filter(i => i === 2).length,
    "3": scale.intervals.filter(i => i === 3).length,
    "4": scale.intervals.filter(i => i === 4).length,
    "5": scale.intervals.filter(i => i === 5).length,
    "6": scale.intervals.filter(i => i === 6).length,
  };
  
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
  
  // Generate modifiers based on alterations
  const modifiers = [];
  
  // Add color modifiers based on interval distribution
  if (counts["4"] >= 2) modifiers.push("Neutral");
  if (counts["6"] >= 2) modifiers.push("Super");
  if (counts["2"] >= 2) modifiers.push("Semi");
  if (counts["1"] >= 1) modifiers.push("Quasi");
  
  // Add harmonic property modifiers
  if (scale.intervals.includes(1)) modifiers.push("Microtonal");
  else if ((counts["2"] + counts["4"]) > (counts["3"] + counts["5"])) modifiers.push("Altered");
  
  // Add intensity modifiers based on the number and type of alterations
  const alterationCount = scale.alterations.length;
  
  if (alterationCount > 4) {
    // Extreme alterations
    if (scale.intervals.includes(1)) modifiers.push("Ultra");
    else if (counts["2"] >= 3) modifiers.push("Hypo");
  }
  
  // Add symmetry modifiers
  let isSymmetric = true;
  for (let i = 0; i < 3; i++) {
    if (scale.intervals[i] !== scale.intervals[6-i]) {
      isSymmetric = false;
      break;
    }
  }
  
  if (isSymmetric) modifiers.push("Symmetric");
  
  // Create composite name
  let compositeName = '';
  if (modifiers.length > 0) {
    compositeName = modifiers.join("") + " " + closestMode;
  } else {
    compositeName = "Modified " + closestMode;
  }
  
  return {
    name: compositeName,
    baseMode: closestMode,
    modifiers: modifiers
  };
}

// Function to generate detailed description of how the scale has been altered
function generateDescription(scale, baseScale) {
  if (scale.alterations.length === 0) {
    return "Original hyperlydian scale with no alterations.";
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
  if (intervalCounts["1"] && intervalCounts["1"] > 0) {
    description += " Contains microtonal intervals.";
  } else if (intervalCounts["2"] && intervalCounts["2"] >= 2) {
    description += " Contains consecutive semitones.";
  } else if (intervalCounts["6"] && intervalCounts["6"] >= 1) {
    description += " Contains augmented intervals.";
  }
  
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
  const harmonicIntervals = [28, 18, 13, 10]; // Approximates harmonics 7, 5, 4, 3
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
  const dissonantIntervals = [1, 2, 6, 17, 16]; // semitone, tritone variants
  
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
  if (dissonantCount >= 4 || scale.intervals.includes(1)) {
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
  
  // Tension assessment
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
  const scalePattern = scale.intervals.join('-');
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
  const enharmonicIntervals = scale.intervals.filter(i => i === 1 || i === 2).length;
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
fs.writeFileSync('scales.json', JSON.stringify(allScales, null, 2));