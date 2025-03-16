import fs from 'fs';

/**
 * COMPREHENSIVE 31-EDO SCALE GENERATOR
 * 
 * Implements six specialized generators for microtonal scales in 31-EDO:
 * 1. Moment of Symmetry (MOS) Scales
 * 2. Well-formed Scales
 * 3. Hybrid/Combination Scales
 * 4. Xenharmonic Scale Families
 * 5. Historical Temperaments
 * 6. Transformed/Reconstructed Scales
 */

// Constants for 31-EDO system
const OCTAVE = 31; // Steps in an octave
const MIN_STEP = 3; // Minimum allowed step size
const MAX_STEP = 7; // Maximum allowed step size

/**
 * 1. MOMENT OF SYMMETRY (MOS) SCALES GENERATOR
 * Generates scales that are maximally even distributions of a generator interval
 */
function generateMOSScales() {
  const scales = [];
  
  // Test different generators and number of notes
  // Main generators in 31-EDO: 18 steps (~perfect fifth), 13 steps (~perfect fourth),
  // 10 steps (~major third), 8 steps (~minor third)
  const generators = [8, 10, 13, 18, 19];
  
  for (const generator of generators) {
    // Generate for different numbers of notes
    for (let numNotes = 5; numNotes <= 9; numNotes++) {
      const result = generateMOSScale(generator, numNotes);
      
      if (result) {
        const { degrees, largeSteps, smallSteps } = result;
        
        // Calculate intervals
        const intervals = calculateIntervals(degrees);
        
        // Validate intervals
        const validIntervals = intervals.every(i => i >= MIN_STEP && i <= MAX_STEP);
        if (!validIntervals) continue;
        
        // Create scale object
        const scale = {
          name: `${numNotes}L${generator}s-MOS`,
          description: `Moment of Symmetry scale with ${numNotes} notes generated using ${generator}-step generator. Contains ${largeSteps} large steps and ${smallSteps} small steps.`,
          degrees: degrees,
          intervals: intervals,
          type: "mos",
          properties: {
            generator: generator,
            noteCount: numNotes,
            largeSteps: largeSteps,
            smallSteps: smallSteps,
            pattern: intervals.join(',')
          }
        };
        
        // Add more familiar name if it's a known scale
        if (generator === 18 && numNotes === 7) {
          scale.name = "Diatonic MOS (7L18s)";
          scale.description += " This is the familiar diatonic scale.";
        } else if (generator === 18 && numNotes === 5) {
          scale.name = "Pentatonic MOS (5L18s)";
          scale.description += " This is similar to the familiar pentatonic scale.";
        }
        
        scales.push(scale);
      }
    }
  }
  
  return scales;
}

/**
 * Helper function to generate a MOS scale with given generator and number of notes
 * @param {Number} generator - Step size of the generator interval
 * @param {Number} numNotes - Number of notes in the scale
 * @returns {Object|null} - The generated scale or null if invalid
 */
function generateMOSScale(generator, numNotes) {
  if (numNotes < 2) return null;
  
  // Generate the scale by repeatedly adding the generator
  let degrees = [0];
  for (let i = 1; i < numNotes * 2; i++) {
    // Calculate next pitch class
    let next = (degrees[i-1] + generator) % OCTAVE;
    degrees.push(next);
  }
  
  // Sort and deduplicate
  degrees = Array.from(new Set(degrees)).sort((a, b) => a - b);
  
  // If we don't have exactly numNotes, it's not a valid MOS
  if (degrees.length !== numNotes) return null;
  
  // Add octave
  degrees.push(OCTAVE);
  
  // Calculate intervals
  const intervals = calculateIntervals(degrees);
  
  // Check if it's a valid MOS (only 2 step sizes)
  const uniqueIntervals = new Set(intervals);
  if (uniqueIntervals.size > 2) return null;
  
  // Count large and small steps
  const stepSizes = Array.from(uniqueIntervals).sort((a, b) => a - b);
  if (stepSizes.length !== 2) return null;
  
  const smallStep = stepSizes[0];
  const largeStep = stepSizes[1];
  
  const smallSteps = intervals.filter(i => i === smallStep).length;
  const largeSteps = intervals.filter(i => i === largeStep).length;
  
  return {
    degrees: degrees,
    largeSteps: largeSteps,
    smallSteps: smallSteps
  };
}

/**
 * 2. WELL-FORMED SCALE GENERATOR
 * Generates scales with specific mathematical properties related to continued fractions
 */
function generateWellFormedScales() {
  const scales = [];
  
  // Key generators for 31-EDO
  const generators = [
    { steps: 8, name: "minor third", ratio: "6:5" },
    { steps: 10, name: "major third", ratio: "5:4" },
    { steps: 13, name: "perfect fourth", ratio: "4:3" },
    { steps: 18, name: "perfect fifth", ratio: "3:2" }
  ];
  
  // Generate chains of various lengths
  for (const gen of generators) {
    for (let length = 5; length <= 12; length++) {
      const scale = generateWellFormedScale(gen.steps, length);
      
      if (scale && isValidScale(scale.intervals)) {
        const namePrefix = getWellFormedNamePrefix(scale.intervals);
        scale.name = `${namePrefix}WF-${gen.name.replace(' ', '')}-${length}`;
        scale.description = `Well-formed scale with ${length} notes generated from stacked ${gen.name}s (${gen.ratio}).`;
        scale.type = "well-formed";
        scale.properties = {
          generator: gen.steps,
          generatorName: gen.name,
          generatorRatio: gen.ratio,
          noteCount: length
        };
        
        scales.push(scale);
      }
    }
  }
  
  return scales;
}

/**
 * Helper function to generate a well-formed scale
 * @param {Number} generator - Step size of the generator interval
 * @param {Number} length - Number of notes in the scale
 * @returns {Object|null} - The generated scale or null if invalid
 */
function generateWellFormedScale(generator, length) {
  // Generate linear chain of pitches
  let pitches = [];
  for (let i = 0; i < length; i++) {
    pitches.push((generator * i) % OCTAVE);
  }
  
  // Sort and add octave
  pitches.sort((a, b) => a - b);
  pitches.push(OCTAVE);
  
  // Calculate intervals
  const intervals = calculateIntervals(pitches);
  
  return {
    degrees: pitches,
    intervals: intervals
  };
}

/**
 * Helper function to get a name prefix for a well-formed scale
 * @param {Array} intervals - Scale intervals
 * @returns {String} - Name prefix
 */
function getWellFormedNamePrefix(intervals) {
  const uniqueIntervals = new Set(intervals);
  
  if (uniqueIntervals.size === 1) {
    return "Equi";
  } else if (uniqueIntervals.size === 2) {
    return "Bi";
  } else if (uniqueIntervals.size === 3) {
    return "Tri";
  } else {
    return "Multi";
  }
}

/**
 * 3. HYBRID SCALE GENERATOR
 * Generates scales that combine elements from different musical traditions
 */
function generateHybridScales() {
  const scales = [];
  
  // Define base scales from different traditions
  const westernScales = [
    { name: "Major", degrees: [0, 5, 10, 13, 18, 23, 28, 31], tradition: "Western" },
    { name: "Minor", degrees: [0, 5, 8, 13, 18, 21, 26, 31], tradition: "Western" },
    { name: "Harmonic Minor", degrees: [0, 5, 8, 13, 18, 21, 28, 31], tradition: "Western" }
  ];
  
  const arabicScales = [
    { name: "Rast", degrees: [0, 5, 9, 13, 18, 23, 27, 31], tradition: "Arabic" },
    { name: "Bayati", degrees: [0, 4, 9, 13, 18, 22, 27, 31], tradition: "Arabic" },
    { name: "Hijaz", degrees: [0, 3, 9, 13, 18, 21, 27, 31], tradition: "Arabic" }
  ];
  
  const indianScales = [
    { name: "Bilawal", degrees: [0, 5, 10, 13, 18, 23, 28, 31], tradition: "Indian" },
    { name: "Kafi", degrees: [0, 5, 8, 13, 18, 23, 26, 31], tradition: "Indian" },
    { name: "Bhairavi", degrees: [0, 3, 8, 13, 18, 21, 26, 31], tradition: "Indian" }
  ];
  
  const bluesScales = [
    { name: "Blues", degrees: [0, 3, 8, 13, 15, 18, 23, 31], tradition: "Blues" },
    { name: "Neutral Blues", degrees: [0, 4, 8, 13, 18, 22, 26, 31], tradition: "Blues" }
  ];
  
  // Define tradition pairs for hybridization
  const traditionPairs = [
    { a: westernScales, b: arabicScales, name: "Arabesqued" },
    { a: westernScales, b: indianScales, name: "Indionized" },
    { a: indianScales, b: bluesScales, name: "Raglues" },
    { a: arabicScales, b: bluesScales, name: "Maqablues" }
  ];
  
  // Generate hybrids for each pair
  for (const pair of traditionPairs) {
    for (const scaleA of pair.a) {
      for (const scaleB of pair.b) {
        // Create tetrachord hybrid
        const tetrachordHybrid = createTetrachordHybrid(scaleA, scaleB);
        if (isValidScale(tetrachordHybrid.intervals)) {
          tetrachordHybrid.name = `${pair.name} ${scaleA.name}-${scaleB.name}`;
          tetrachordHybrid.description = `Hybrid scale with lower tetrachord from ${scaleA.tradition} ${scaleA.name} and upper tetrachord from ${scaleB.tradition} ${scaleB.name}.`;
          tetrachordHybrid.type = "hybrid-tetrachord";
          tetrachordHybrid.properties = {
            lowerTradition: scaleA.tradition,
            lowerScale: scaleA.name,
            upperTradition: scaleB.tradition,
            upperScale: scaleB.name
          };
          scales.push(tetrachordHybrid);
        }
        
        // Create alternating hybrid
        const alternatingHybrid = createAlternatingHybrid(scaleA, scaleB);
        if (isValidScale(alternatingHybrid.intervals)) {
          alternatingHybrid.name = `Alternating ${pair.name} ${scaleA.name}-${scaleB.name}`;
          alternatingHybrid.description = `Hybrid scale alternating between notes from ${scaleA.tradition} ${scaleA.name} and ${scaleB.tradition} ${scaleB.name}.`;
          alternatingHybrid.type = "hybrid-alternating";
          alternatingHybrid.properties = {
            tradition1: scaleA.tradition,
            scale1: scaleA.name,
            tradition2: scaleB.tradition,
            scale2: scaleB.name
          };
          scales.push(alternatingHybrid);
        }
      }
    }
  }
  
  return scales;
}

/**
 * Helper function to create a tetrachord hybrid scale
 * @param {Object} scaleA - First scale (lower tetrachord)
 * @param {Object} scaleB - Second scale (upper tetrachord)
 * @returns {Object} - The hybrid scale
 */
function createTetrachordHybrid(scaleA, scaleB) {
  // Take lower tetrachord (first 4 notes) from scaleA
  const lowerTetrachord = scaleA.degrees.slice(0, 4);
  
  // Take upper tetrachord from scaleB, transposed to start at the 4th degree
  const upperStart = scaleB.degrees.findIndex(d => d >= 13);
  let upperTetrachord = scaleB.degrees.slice(upperStart);
  
  // Ensure we don't duplicate the 4th degree
  if (upperTetrachord[0] === lowerTetrachord[3]) {
    upperTetrachord = upperTetrachord.slice(1);
  }
  
  // Combine and ensure octave is included
  const degrees = [...lowerTetrachord, ...upperTetrachord];
  if (degrees[degrees.length - 1] !== OCTAVE) {
    degrees.push(OCTAVE);
  }
  
  // Calculate intervals
  const intervals = calculateIntervals(degrees);
  
  return {
    degrees: degrees,
    intervals: intervals
  };
}

/**
 * Helper function to create an alternating hybrid scale
 * @param {Object} scaleA - First scale
 * @param {Object} scaleB - Second scale
 * @returns {Object} - The hybrid scale
 */
function createAlternatingHybrid(scaleA, scaleB) {
  // Set up degrees array with root and octave
  let degrees = [0];
  
  // Create arrays of internal scale degrees (excluding root and octave)
  const innerDegreesA = scaleA.degrees.slice(1, -1);
  const innerDegreesB = scaleB.degrees.slice(1, -1);
  
  // Get the smaller length
  const minLength = Math.min(innerDegreesA.length, innerDegreesB.length);
  
  // Alternate between scales
  for (let i = 0; i < minLength; i++) {
    if (i % 2 === 0) {
      degrees.push(innerDegreesA[i]);
    } else {
      degrees.push(innerDegreesB[i]);
    }
  }
  
  // Add octave and sort
  degrees.push(OCTAVE);
  degrees.sort((a, b) => a - b);
  
  // Remove duplicates
  degrees = Array.from(new Set(degrees));
  
  // Calculate intervals
  const intervals = calculateIntervals(degrees);
  
  return {
    degrees: degrees,
    intervals: intervals
  };
}

/**
 * 4. XENHARMONIC SCALE GENERATOR
 * Generates scales designed specifically to explore 31-EDO's unique properties
 */
function generateXenharmonicScales() {
  const scales = [];
  
  // Generate scales focusing on neutral intervals
  const neutralScales = generateNeutralIntervalScales();
  scales.push(...neutralScales);
  
  // Generate scales with uniform step patterns
  const patternedScales = generatePatternedScales();
  scales.push(...patternedScales);
  
  // Generate scales with unusual interval combinations
  const exoticScales = generateExoticIntervalScales();
  scales.push(...exoticScales);
  
  return scales;
}

/**
 * Helper function to generate scales focusing on neutral intervals
 * @returns {Array} - Collection of neutral interval scales
 */
function generateNeutralIntervalScales() {
  const scales = [];
  
  // Neutral second = 4 steps
  // Neutral third = 9 steps
  // Neutral sixth = 22 steps
  // Neutral seventh = 26 steps
  
  // Create scales with various arrangements of neutral intervals
  const neutralPatterns = [
    {
      degrees: [0, 4, 9, 13, 18, 22, 26, 31],
      name: "Complete Neutriton",
      description: "Scale with all neutral intervals (2nd, 3rd, 6th, 7th)"
    },
    {
      degrees: [0, 4, 9, 13, 18, 23, 27, 31],
      name: "Neutral Triad",
      description: "Scale with neutral 2nd and 3rd but standard 6th and 7th"
    },
    {
      degrees: [0, 5, 9, 13, 18, 22, 27, 31],
      name: "Neutral Mediant",
      description: "Scale with neutral 3rd and 6th but standard 2nd and 7th"
    },
    {
      degrees: [0, 4, 8, 13, 18, 22, 26, 31],
      name: "Neutralized Minor",
      description: "Minor scale with 2nd, 6th and 7th replaced by neutral equivalents"
    },
    {
      degrees: [0, 4, 9, 13, 18, 22, 28, 31],
      name: "Semi-Neutralized",
      description: "Scale with neutral 2nd, 3rd and 6th but major 7th"
    }
  ];
  
  for (const pattern of neutralPatterns) {
    // Calculate intervals
    const intervals = calculateIntervals(pattern.degrees);
    
    const scale = {
      name: pattern.name,
      description: pattern.description,
      degrees: pattern.degrees,
      intervals: intervals,
      type: "xenharmonic-neutral",
      properties: {
        neutralSeconds: intervals.filter(i => i === 4).length,
        neutralThirds: pattern.degrees.includes(9)
      }
    };
    
    scales.push(scale);
  }
  
  return scales;
}

/**
 * Helper function to generate scales with patterned intervals
 * @returns {Array} - Collection of scales with patterned intervals
 */
function generatePatternedScales() {
  const scales = [];
  
  // Define possible step sizes
  const stepSizes = [3, 4, 5, 6];
  
  // Generate scales with alternating patterns
  for (const s1 of stepSizes) {
    for (const s2 of stepSizes) {
      if (s1 === s2) continue; // Skip if they're the same
      
      // Create pattern that fits within octave
      const pattern = [s1, s2];
      const scale = generateScaleFromPattern(pattern);
      
      if (scale) {
        scale.name = `${s1}${s2}-Alternator`;
        scale.description = `Xenharmonic scale alternating between ${s1}-step and ${s2}-step intervals.`;
        scale.type = "xenharmonic-patterned";
        scale.properties = {
          pattern: pattern.join(','),
          step1: s1,
          step2: s2
        };
        
        scales.push(scale);
      }
    }
  }
  
  // Generate scales with 3-step patterns
  for (const s1 of stepSizes) {
    for (const s2 of stepSizes) {
      for (const s3 of stepSizes) {
        // Limit to avoid explosion of scales
        if (s1 === s2 && s2 === s3) continue;
        
        // Create pattern
        const pattern = [s1, s2, s3];
        const scale = generateScaleFromPattern(pattern);
        
        if (scale) {
          scale.name = `${s1}${s2}${s3}-Trialternator`;
          scale.description = `Xenharmonic scale with repeating pattern of ${s1}, ${s2}, and ${s3} step intervals.`;
          scale.type = "xenharmonic-patterned";
          scale.properties = {
            pattern: pattern.join(','),
            step1: s1,
            step2: s2,
            step3: s3
          };
          
          scales.push(scale);
        }
      }
    }
  }
  
  return scales;
}

/**
 * Helper function to generate a scale from a repeating interval pattern
 * @param {Array} pattern - The interval pattern to repeat
 * @returns {Object|null} - The generated scale or null if invalid
 */
function generateScaleFromPattern(pattern) {
  // Calculate how many complete patterns fit in an octave
  const patternSum = pattern.reduce((a, b) => a + b, 0);
  let repetitions = Math.floor(OCTAVE / patternSum);
  
  // Create degrees array starting with 0
  const degrees = [0];
  let currentDegree = 0;
  
  // Add degrees for complete patterns
  for (let i = 0; i < repetitions; i++) {
    for (const step of pattern) {
      currentDegree += step;
      degrees.push(currentDegree);
    }
  }
  
  // Add remaining degrees to get as close to octave as possible
  let j = 0;
  while (currentDegree < OCTAVE - MAX_STEP) {
    const nextStep = pattern[j % pattern.length];
    currentDegree += nextStep;
    degrees.push(currentDegree);
    j++;
  }
  
  // Ensure octave is included
  if (degrees[degrees.length - 1] !== OCTAVE) {
    degrees.push(OCTAVE);
  }
  
  // Calculate intervals
  const intervals = calculateIntervals(degrees);
  
  return {
    degrees: degrees,
    intervals: intervals
  };
}

/**
 * Helper function to generate scales with unusual interval combinations
 * @returns {Array} - Collection of scales with exotic intervals
 */
function generateExoticIntervalScales() {
  const scales = [];
  
  // Create scales with unusual interval combinations
  const exoticPatterns = [
    {
      degrees: [0, 3, 6, 10, 18, 21, 24, 31],
      name: "Superflat Xenotonic",
      description: "Scale with stacked semitones in the lower tetrachord and upper tetrachord"
    },
    {
      degrees: [0, 3, 10, 13, 18, 21, 28, 31],
      name: "Supermajor Xenotonic",
      description: "Scale featuring augmented seconds and major thirds"
    },
    {
      degrees: [0, 6, 12, 18, 24, 31],
      name: "Whole-tone Xenotonic",
      description: "Scale composed of 6-step intervals (augmented seconds)"
    },
    {
      degrees: [0, 4, 10, 14, 20, 24, 31],
      name: "Neutral-augmented Xenotonic",
      description: "Scale alternating between neutral seconds and major thirds"
    },
    {
      degrees: [0, 1, 5, 10, 13, 18, 23, 28, 31],
      name: "Ultrachromatic Xenotonic",
      description: "Scale featuring a quartertone step and otherwise standard major intervals"
    }
  ];
  
  for (const pattern of exoticPatterns) {
    // Calculate intervals
    const intervals = calculateIntervals(pattern.degrees);
    
    const scale = {
      name: pattern.name,
      description: pattern.description,
      degrees: pattern.degrees,
      intervals: intervals,
      type: "xenharmonic-exotic",
      properties: {
        uniqueIntervals: new Set(intervals).size,
        smallestInterval: Math.min(...intervals),
        largestInterval: Math.max(...intervals)
      }
    };
    
    scales.push(scale);
  }
  
  return scales;
}

/**
 * 5. HISTORICAL TEMPERAMENT GENERATOR
 * Generates approximations of historical European temperaments in 31-EDO
 */
function generateHistoricalTemperaments() {
  const scales = [];
  
  // Define historical temperaments and their 31-EDO approximations
  const temperaments = [
    { 
      name: "Quarter-comma Meantone",
      description: "31-EDO approximation of 1/4-comma meantone temperament",
      degrees: [0, 5, 10, 13, 18, 23, 28, 31],
      era: "Renaissance/Baroque",
      qualities: "Pure major thirds, wolf fifth"
    },
    { 
      name: "Sixth-comma Meantone",
      description: "31-EDO approximation of 1/6-comma meantone temperament",
      degrees: [0, 5, 10, 15, 18, 23, 28, 31],
      era: "Baroque",
      qualities: "Better fifths than 1/4-comma, still good thirds"
    },
    { 
      name: "Werckmeister III",
      description: "31-EDO approximation of Werckmeister's third temperament",
      degrees: [0, 5, 10, 15, 18, 23, 27, 31],
      era: "Late Baroque",
      qualities: "Well-temperament with varying key colors"
    },
    { 
      name: "Kirnberger III",
      description: "31-EDO approximation of Kirnberger's third temperament",
      degrees: [0, 5, 9, 14, 18, 23, 27, 31],
      era: "Classical",
      qualities: "Pure fifths in most common keys"
    },
    { 
      name: "Just Intonation Major",
      description: "31-EDO approximation of just intonation major scale",
      degrees: [0, 5, 10, 13, 18, 23, 28, 31],
      era: "Theoretical",
      qualities: "Approximates pure 5-limit just intonation ratios"
    },
    { 
      name: "Pythagorean",
      description: "31-EDO approximation of Pythagorean tuning",
      degrees: [0, 5, 10, 15, 18, 23, 28, 31],
      era: "Medieval",
      qualities: "Chain of pure fifths, sharp major thirds"
    }
  ];
  
  for (const temp of temperaments) {
    // Calculate intervals
    const intervals = calculateIntervals(temp.degrees);
    
    const scale = {
      name: temp.name,
      description: temp.description,
      degrees: temp.degrees,
      intervals: intervals,
      type: "historical-temperament",
      properties: {
        era: temp.era,
        qualities: temp.qualities
      }
    };
    
    scales.push(scale);
    
    // Generate modal variants for each temperament
    const modeNames = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];
    
    for (let i = 1; i < temp.degrees.length - 1; i++) {
      const mode = rotateScale(scale, i);
      mode.name = `${temp.name} ${modeNames[i-1]}`;
      mode.description = `${modeNames[i-1]} mode of the ${temp.name} temperament.`;
      mode.properties = {
        ...scale.properties,
        baseTemperament: temp.name,
        mode: modeNames[i-1]
      };
      
      scales.push(mode);
    }
  }
  
  return scales;
}

/**
 * Helper function to rotate a scale to create a mode
 * @param {Object} scale - The scale to rotate
 * @param {Number} rotationSteps - Number of steps to rotate
 * @returns {Object} - The rotated scale
 */
function rotateScale(scale, rotationSteps) {
  if (!scale || !scale.degrees || !Array.isArray(scale.degrees) || rotationSteps >= scale.degrees.length) {
    return {
      degrees: [0, 31],
      intervals: [31],
      type: "error"
    };
  }
  
  // Get the degree corresponding to the rotation
  const rotationDegree = scale.degrees[rotationSteps];
  
  // Create new degrees array
  let newDegrees = [];
  
  // Rotate and transpose
  for (let i = rotationSteps; i < scale.degrees.length; i++) {
    newDegrees.push(scale.degrees[i] - rotationDegree);
  }
  
  for (let i = 1; i < rotationSteps; i++) {
    newDegrees.push(OCTAVE + (scale.degrees[i] - rotationDegree));
  }
  
  // Sort and add octave
  newDegrees.sort((a, b) => a - b);
  if (newDegrees[newDegrees.length - 1] !== OCTAVE) {
    newDegrees.push(OCTAVE);
  }
  
  // Calculate intervals
  const intervals = calculateIntervals(newDegrees);
  
  return {
    degrees: newDegrees,
    intervals: intervals,
    type: scale.type
  };
}

/**
 * 6. TRANSFORMED SCALE GENERATOR
 * Generates scales by applying transformations to existing scales
 */
function generateTransformedScales() {
  const scales = [];
  
  // Get base scales from various categories
  const baseScales = [];
  
  // Add some Western scales
  baseScales.push(
    { name: "Major", degrees: [0, 5, 10, 13, 18, 23, 28, 31], tradition: "Western", intervals: [5, 5, 3, 5, 5, 5, 3] },
    { name: "Minor", degrees: [0, 5, 8, 13, 18, 21, 26, 31], tradition: "Western", intervals: [5, 3, 5, 5, 3, 5, 5] },
    { name: "Harmonic Minor", degrees: [0, 5, 8, 13, 18, 21, 28, 31], tradition: "Western", intervals: [5, 3, 5, 5, 3, 7, 3] }
  );
  
  // Add some ethnic scales
  baseScales.push(
    { name: "Rast", degrees: [0, 5, 9, 13, 18, 23, 27, 31], tradition: "Arabic", intervals: [5, 4, 4, 5, 5, 4, 4] },
    { name: "Hijaz", degrees: [0, 3, 9, 13, 18, 21, 27, 31], tradition: "Arabic", intervals: [3, 6, 4, 5, 3, 6, 4] },
    { name: "Bhairavi", degrees: [0, 3, 8, 13, 18, 21, 26, 31], tradition: "Indian", intervals: [3, 5, 5, 5, 3, 5, 5] }
  );
  
  // Add exotic scales
  baseScales.push(
    { name: "Whole Tone", degrees: [0, 5, 10, 15, 20, 25, 31], tradition: "Modern", intervals: [5, 5, 5, 5, 5, 6] },
    { name: "Neutral", degrees: [0, 4, 9, 13, 18, 22, 27, 31], tradition: "Microtonal", intervals: [4, 5, 4, 5, 4, 5, 4] }
  );
  
  // For each base scale, create transformed versions
  for (const base of baseScales) {
    // Ensure each base scale has valid intervals
    if (!base.intervals) {
      base.intervals = calculateIntervals(base.degrees);
    }
    
    // Create an inverted version (flip interval pattern)
    const inverted = invertScale(base);
    
    if (isValidScale(inverted.intervals)) {
      inverted.name = `Inverted ${base.name}`;
      inverted.description = `Scale with inverted interval pattern of ${base.tradition} ${base.name}.`;
      inverted.type = "transformed-inverted";
      inverted.properties = {
        baseName: base.name,
        baseTradition: base.tradition,
        transformation: "inversion"
      };
      scales.push(inverted);
    }
    
    // Create a retrograde version (reverse interval pattern)
    const retrograde = retrogradeScale(base);
    
    if (isValidScale(retrograde.intervals)) {
      retrograde.name = `Retrograde ${base.name}`;
      retrograde.description = `Scale with reversed interval pattern of ${base.tradition} ${base.name}.`;
      retrograde.type = "transformed-retrograde";
      retrograde.properties = {
        baseName: base.name,
        baseTradition: base.tradition,
        transformation: "retrograde"
      };
      scales.push(retrograde);
    }
    
    // Create a complementary version
    const complement = complementScale(base);
    
    if (isValidScale(complement.intervals)) {
      complement.name = `Complement ${base.name}`;
      complement.description = `Scale using intervals complementary to those in ${base.tradition} ${base.name}.`;
      complement.type = "transformed-complement";
      complement.properties = {
        baseName: base.name,
        baseTradition: base.tradition,
        transformation: "complement"
      };
      scales.push(complement);
    }
    
    // Create diminished and augmented versions
    const diminished = transformScale(base, -1);
    if (isValidScale(diminished.intervals)) {
      diminished.name = `Diminished ${base.name}`;
      diminished.description = `Scale derived by diminishing each interval of ${base.tradition} ${base.name} by one step.`;
      diminished.type = "transformed-diminished";
      diminished.properties = {
        baseName: base.name,
        baseTradition: base.tradition,
        transformation: "diminution"
      };
      scales.push(diminished);
    }
    
    const augmented = transformScale(base, 1);
    if (isValidScale(augmented.intervals)) {
      augmented.name = `Augmented ${base.name}`;
      augmented.description = `Scale derived by augmenting each interval of ${base.tradition} ${base.name} by one step.`;
      augmented.type = "transformed-augmented";
      augmented.properties = {
        baseName: base.name,
        baseTradition: base.tradition,
        transformation: "augmentation"
      };
      scales.push(augmented);
    }
  }
  
  return scales;
}

/**
 * Helper function to invert a scale (flip the interval pattern)
 * @param {Object} scale - The scale to invert
 * @returns {Object} - The inverted scale
 */
function invertScale(scale) {
  // Make a copy of the intervals and reverse them
  if (!scale.intervals || !Array.isArray(scale.intervals)) {
    // If intervals are missing, calculate them
    const intervals = calculateIntervals(scale.degrees);
    scale.intervals = intervals;
  }
  
  const invertedIntervals = [...scale.intervals].reverse();
  
  // Create degrees using inverted intervals
  const degrees = [0];
  let currentDegree = 0;
  
  for (const interval of invertedIntervals) {
    currentDegree += interval;
    if (currentDegree <= OCTAVE) {
      degrees.push(currentDegree);
    }
  }
  
  // Ensure octave is included
  if (degrees[degrees.length - 1] !== OCTAVE) {
    degrees.push(OCTAVE);
  }
  
  // Recalculate intervals
  const intervals = calculateIntervals(degrees);
  
  return {
    degrees: degrees,
    intervals: intervals
  };
}

/**
 * Helper function to retrograde a scale (reverse the interval pattern)
 * @param {Object} scale - The scale to retrograde
 * @returns {Object} - The retrograde scale
 */
function retrogradeScale(scale) {
  // Ensure scale has intervals
  if (!scale.intervals || !Array.isArray(scale.intervals)) {
    scale.intervals = calculateIntervals(scale.degrees);
  }

  // Reverse the degrees, then normalize to start at 0
  let retroDegrees = [...scale.degrees].reverse();
  const highestDegree = retroDegrees[0];
  
  // Transpose so it starts at 0
  retroDegrees = retroDegrees.map(d => OCTAVE - (highestDegree - d));
  
  // Ensure we start at 0
  if (retroDegrees[0] !== 0) {
    retroDegrees[0] = 0;
  }
  
  // Ensure octave is included
  if (retroDegrees[retroDegrees.length - 1] !== OCTAVE) {
    retroDegrees.push(OCTAVE);
  }
  
  // Calculate intervals
  const intervals = calculateIntervals(retroDegrees);
  
  return {
    degrees: retroDegrees,
    intervals: intervals
  };
}

/**
 * Helper function to create a complementary scale (use intervals not in the original)
 * @param {Object} scale - The original scale
 * @returns {Object} - The complementary scale
 */
function complementScale(scale) {
  // Start with all possible degrees in 31-EDO
  const allDegrees = [];
  for (let i = 0; i <= OCTAVE; i++) {
    allDegrees.push(i);
  }
  
  // Remove degrees that are in the original scale
  const complementDegrees = allDegrees.filter(d => !scale.degrees.includes(d));
  
  // Ensure 0 and octave are included
  if (!complementDegrees.includes(0)) {
    complementDegrees.unshift(0);
  }
  if (!complementDegrees.includes(OCTAVE)) {
    complementDegrees.push(OCTAVE);
  }
  
  // Sort degrees
  complementDegrees.sort((a, b) => a - b);
  
  // Calculate intervals
  const intervals = calculateIntervals(complementDegrees);
  
  return {
    degrees: complementDegrees,
    intervals: intervals
  };
}

/**
 * Helper function to transform a scale by changing each interval by a fixed amount
 * @param {Object} scale - The original scale
 * @param {Number} change - The amount to change each interval
 * @returns {Object} - The transformed scale
 */
function transformScale(scale, change) {
  // Ensure scale has intervals
  if (!scale.intervals || !Array.isArray(scale.intervals)) {
    scale.intervals = calculateIntervals(scale.degrees);
  }
  
  // Create new intervals by applying the change
  const newIntervals = scale.intervals.map(i => {
    const transformed = i + change;
    return Math.max(MIN_STEP, Math.min(MAX_STEP, transformed));
  });
  
  // Create degrees using new intervals
  const degrees = [0];
  let currentDegree = 0;
  
  for (const interval of newIntervals) {
    currentDegree += interval;
    if (currentDegree <= OCTAVE) {
      degrees.push(currentDegree);
    }
  }
  
  // Ensure octave is included
  if (degrees[degrees.length - 1] !== OCTAVE) {
    degrees.push(OCTAVE);
  }
  
  // Recalculate intervals (they might differ from newIntervals due to octave adjustment)
  const intervals = calculateIntervals(degrees);
  
  return {
    degrees: degrees,
    intervals: intervals
  };
}

/**
 * Helper function to calculate intervals from scale degrees
 * @param {Array} degrees - Scale degrees
 * @returns {Array} - Intervals between consecutive degrees
 */
function calculateIntervals(degrees) {
  if (!degrees || !Array.isArray(degrees)) {
    return [];
  }
  
  const intervals = [];
  for (let i = 0; i < degrees.length - 1; i++) {
    intervals.push(degrees[i+1] - degrees[i]);
  }
  return intervals;
}

/**
 * Helper function to check if a scale has valid intervals
 * @param {Array} intervals - The intervals to check
 * @returns {Boolean} - True if all intervals are valid
 */
function isValidScale(intervals) {
  if (!intervals || !Array.isArray(intervals)) return false;
  return intervals.every(interval => interval >= MIN_STEP && interval <= MAX_STEP);
}

/**
 * MAIN FUNCTION
 * Generates all scale categories and provides statistics and examples
 */
function generateAllMissingScales() {
  console.log("Generating comprehensive collection of 31-EDO scales...");
  console.time("Generation time");
  
  // Generate all scale categories
  const allScales = {
    mos: generateMOSScales(),
    wellFormed: generateWellFormedScales(),
    hybrid: generateHybridScales(),
    xenharmonic: generateXenharmonicScales(),
    historical: generateHistoricalTemperaments(),
    transformed: generateTransformedScales()
  };
  
  console.timeEnd("Generation time");
  
  // Calculate statistics
  const stats = {
    totalScales: 0,
    byCategory: {}
  };
  
  for (const category in allScales) {
    stats.byCategory[category] = allScales[category].length;
    stats.totalScales += allScales[category].length;
  }
  
  // Print statistics
  console.log(`\nGenerated ${stats.totalScales} total scales`);
  console.log("Scales by category:");
  for (const category in stats.byCategory) {
    console.log(`  ${category}: ${stats.byCategory[category]}`);
  }
  
  // Print sample scales from each category
  const categories = Object.keys(allScales);
  for (const category of categories) {
    console.log(`\n=== Sample ${category} scales ===`);
    
    const categoryScales = allScales[category];
    const sampleCount = Math.min(3, categoryScales.length);
    
    for (let i = 0; i < sampleCount; i++) {
      const scale = categoryScales[i];
      console.log(`\n${scale.name}`);
      console.log(`Description: ${scale.description}`);
      console.log(`Degrees: [${scale.degrees.join(', ')}]`);
      console.log(`Intervals: [${scale.intervals.join(', ')}]`);
      
      if (scale.properties) {
        console.log("Properties:");
        for (const prop in scale.properties) {
          console.log(`  ${prop}: ${scale.properties[prop]}`);
        }
      }
    }
  }
  
  // Return all scales
  return {
    scales: allScales,
    stats: stats
  };
}

/**
 * COMBINED SCALE GENERATOR
 * Combines all existing and missing scale generators
 */
function generateCompleteScaleLibrary() {
  // Get all missing scales
  const missingScales = generateAllMissingScales();
  
  // Here you would integrate with the original heptatonic generators
  // and other previous scale generators
  
  // For demonstration, we'll just return the missing scales
  return missingScales;
}

// Execute the scale generation
const result = generateCompleteScaleLibrary();
console.log(`\nTotal unique scales: ${result.stats.totalScales}`);

// Export complete data as JSON
// console.log(JSON.stringify(result.scales, null, 2));
fs.writeFileSync('public/data/extraScales.json', JSON.stringify(result.scales, null, 2));