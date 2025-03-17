import fs from 'fs';

/**
 * ALTERNATIVE FLATTENING APPROACHES - 31-EDO
 * Script 1: Advanced Heptatonic Generator with Non-Sequential Flattening
 * Generates scales by flattening notes out of the standard circle of fourths order
 * with constraints to maintain musical coherence
 */

// Constants for 31-EDO system
const OCTAVE = 31;
const MIN_STEP = 3; // Minimum allowed step size
const MAX_STEP = 7; // Maximum allowed step size

/**
 * Generates heptatonic scales using a non-sequential flattening approach
 * @returns {Array} Collection of heptatonic scales with non-sequential flattening
 */
function generateNonSequentialHeptatonicScales() {
  const scales = [];
  
  // Start with hyperlydian as base
  const baseScale = {
    degrees: [0, 5, 10, 13, 18, 23, 28, 31], // Including octave
    intervals: [5, 5, 3, 5, 5, 5, 3],
    name: "Hyperlydian",
    description: "Original hyperlydian scale with maximum brightness.",
    alterations: [],
    type: "heptatonic"
  };
  
  scales.push(JSON.parse(JSON.stringify(baseScale)));
  
  // Recursive function to explore all possible flattening combinations
  function exploreFlattening(scale, degreesMutated = new Set(), depth = 0, path = []) {
    // Stop recursion at reasonable depth to avoid combinatorial explosion
    if (depth > 12) return;
    
    // Try flattening each degree
    for (let degree = 0; degree < 7; degree++) {
      // Create a new scale by flattening this degree
      const newScale = JSON.parse(JSON.stringify(scale));
      
      // Calculate the index of the previous degree (wrap around if needed)
      const prevDegree = (degree - 1 + 7) % 7;
      
      // Check if flattening would violate the minimum step constraint
      // by making the interval between the previous degree and this one too small
      const intervalBefore = newScale.intervals[prevDegree];
      if (intervalBefore <= MIN_STEP) continue;
      
      // Flatten the note
      newScale.degrees[degree]--;
      
      // Track the alteration
      const newDegreesMutated = new Set(degreesMutated);
      newDegreesMutated.add(degree);
      
      // Update intervals
      recalculateIntervals(newScale);
      
      // Check if any interval is now out of bounds
      const validIntervals = newScale.intervals.every(interval => 
        interval >= MIN_STEP && interval <= MAX_STEP
      );
      
      if (!validIntervals) continue;
      
      // Track the alteration
      const degreeNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
      newScale.alterations.push({
        degree: degree,
        degreeName: degreeNames[degree],
        steps: 1 + (scale.alterations.filter(a => a.degree === degree).length)
      });
      
      // Create a unique key for this scale to avoid duplicates
      const scaleKey = newScale.degrees.join(',');
      
      // Check if we already have this scale
      const isDuplicate = scales.some(existingScale => 
        existingScale.degrees.join(',') === scaleKey
      );
      
      if (!isDuplicate) {
        // Generate name and description
        const newPath = [...path, degree];
        newScale.name = generateNonSequentialScaleName(newScale, newDegreesMutated, newPath);
        newScale.description = generateNonSequentialDescription(newScale, newDegreesMutated);
        newScale.mutationPath = newPath.join('-');
        
        // Add to collection
        scales.push(JSON.parse(JSON.stringify(newScale)));
        
        // Continue exploring from this new scale
        exploreFlattening(newScale, newDegreesMutated, depth + 1, newPath);
      }
    }
  }
  
  // Start exploration from the base scale
  exploreFlattening(baseScale);
  
  return scales;
}

/**
 * Generate a name for non-sequential flattened scales
 * @param {Object} scale - The scale to name
 * @param {Set} mutatedDegrees - Set of degrees that have been mutated
 * @param {Array} path - The mutation path
 * @returns {String} Scale name
 */
function generateNonSequentialScaleName(scale, mutatedDegrees, path) {
  // Count the number of mutations for each degree
  const mutationCounts = {};
  for (const alt of scale.alterations) {
    mutationCounts[alt.degree] = (mutationCounts[alt.degree] || 0) + 1;
  }
  
  // Determine the mutation pattern
  let patternType = "";
  if (mutatedDegrees.size === 1) {
    patternType = "Mono";
  } else if (mutatedDegrees.size === 2) {
    const degreesArray = Array.from(mutatedDegrees);
    const distance = Math.abs(degreesArray[0] - degreesArray[1]);
    if (distance === 1 || distance === 6) {
      patternType = "Quasi";
    } else if (distance === 2 || distance === 5) {
      patternType = "Semi";
    } else if (distance === 3 || distance === 4) {
      patternType = "Nu";
    }
  } else if (mutatedDegrees.size === 3) {
    patternType = "Tri";
  } else if (mutatedDegrees.size >= 4) {
    patternType = "Poly";
  }
  
  // Look for common interval patterns
  const intervalCounts = {};
  for (const interval of scale.intervals) {
    intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
  }
  
  // Base mode identification
  let baseMode = identifyBaseMode(scale.intervals);
  
  // Special prefixes based on interval distribution
  let prefix = "";
  if (intervalCounts[4] && intervalCounts[4] >= 2) {
    prefix += "Neutral";
  } else if (intervalCounts[3] && intervalCounts[3] >= 3) {
    prefix += "Soft";
  } else if (intervalCounts[6] && intervalCounts[6] >= 2) {
    prefix += "Super";
  } else if (intervalCounts[5] && intervalCounts[5] >= 5) {
    prefix += "Hard";
  }
  
  // Add symmetry detection
  let isSymmetric = true;
  for (let i = 0; i < 3; i++) {
    if (scale.intervals[i] !== scale.intervals[6-i]) {
      isSymmetric = false;
      break;
    }
  }
  
  if (isSymmetric) {
    prefix = (prefix ? prefix + " " : "") + "Symmetric";
  }
  
  // Compile the name
  let name = "";
  if (patternType) {
    name = patternType + (baseMode ? baseMode : "");
  } else {
    name = (baseMode ? baseMode : "Modal");
  }
  
  if (prefix) {
    name = prefix + " " + name;
  }
  
  // Special case for unique mutation patterns
  if (path && path.length > 0) {
    // Check for zigzag pattern (alternating up/down in the scale)
    let isZigzag = true;
    for (let i = 1; i < path.length; i++) {
      if (Math.abs(path[i] - path[i-1]) !== 2 && Math.abs(path[i] - path[i-1]) !== 5) {
        isZigzag = false;
        break;
      }
    }
    
    if (isZigzag && path.length >= 3) {
      name = "Zigzag " + name;
    }
    
    // Check for sequential movement
    let isSequential = true;
    const direction = Math.sign(path[1] - path[0]);
    for (let i = 1; i < path.length; i++) {
      if (Math.sign(path[i] - path[i-1]) !== direction) {
        isSequential = false;
        break;
      }
    }
    
    if (isSequential && path.length >= 3) {
      name = "Cascade " + name;
    }
  }
  
  return name;
}

/**
 * Generate a description for non-sequential flattened scales
 * @param {Object} scale - The scale to describe
 * @param {Set} mutatedDegrees - Set of degrees that have been mutated
 * @returns {String} Scale description
 */
function generateNonSequentialDescription(scale, mutatedDegrees) {
  const degreeNames = ["1st (tonic)", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  
  // Count mutations per degree
  const mutationsByDegree = {};
  for (const alt of scale.alterations) {
    mutationsByDegree[alt.degree] = (mutationsByDegree[alt.degree] || 0) + 1;
  }
  
  let description = "Derived from hyperlydian by flattening ";
  
  // Describe which degrees were flattened and by how much
  const alterationDescriptions = [];
  for (const degree in mutationsByDegree) {
    const steps = mutationsByDegree[degree];
    alterationDescriptions.push(`the ${degreeNames[degree]} by ${steps} step${steps !== 1 ? 's' : ''}`);
  }
  
  if (alterationDescriptions.length === 1) {
    description += alterationDescriptions[0] + ".";
  } else if (alterationDescriptions.length === 2) {
    description += alterationDescriptions.join(" and ") + ".";
  } else {
    const lastAlteration = alterationDescriptions.pop();
    description += alterationDescriptions.join(", ") + ", and " + lastAlteration + ".";
  }
  
  // Describe the pattern of flattening
  if (mutatedDegrees.size > 1) {
    const pattern = determineMutationPattern(mutatedDegrees);
    if (pattern) {
      description += ` Follows a ${pattern} flattening pattern.`;
    }
  }
  
  // Describe the resulting interval structure
  const intervalCounts = {};
  for (const interval of scale.intervals) {
    intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
  }
  
  // Add information about unusual intervals
  const intervalDescriptions = [];
  if (intervalCounts[3] && intervalCounts[3] >= 3) {
    intervalDescriptions.push("multiple minor seconds");
  }
  if (intervalCounts[4] && intervalCounts[4] >= 2) {
    intervalDescriptions.push("neutral seconds");
  }
  if (intervalCounts[6] && intervalCounts[6] >= 1) {
    intervalDescriptions.push("augmented seconds");
  }
  if (intervalCounts[7] && intervalCounts[7] >= 1) {
    intervalDescriptions.push("superaugmented seconds");
  }
  
  if (intervalDescriptions.length > 0) {
    description += " Contains " + intervalDescriptions.join(", ") + ".";
  }
  
  return description;
}

/**
 * Determine the pattern of mutations
 * @param {Set} mutatedDegrees - Set of degrees that have been mutated
 * @returns {String} Pattern description
 */
function determineMutationPattern(mutatedDegrees) {
  const degrees = Array.from(mutatedDegrees).sort((a, b) => a - b);
  
  // Check for consecutive degrees
  let isConsecutive = true;
  for (let i = 1; i < degrees.length; i++) {
    if (degrees[i] !== degrees[i-1] + 1 && !(degrees[i-1] === 6 && degrees[i] === 0)) {
      isConsecutive = false;
      break;
    }
  }
  
  if (isConsecutive) return "consecutive";
  
  // Check for alternating degrees
  if (degrees.length >= 3) {
    let isAlternating = true;
    const step = degrees[1] - degrees[0];
    for (let i = 1; i < degrees.length; i++) {
      const expectedDegree = (degrees[0] + i * step) % 7;
      if (degrees[i] !== expectedDegree) {
        isAlternating = false;
        break;
      }
    }
    
    if (isAlternating) return "alternating";
  }
  
  // Check for symmetrical pattern around a pivot
  const midpoint = Math.floor(degrees.length / 2);
  let isSymmetrical = true;
  for (let i = 0; i < midpoint; i++) {
    // Calculate the expected symmetric position (mod 7)
    const expectedSymmetricPos = (7 - degrees[i]) % 7;
    if (degrees[degrees.length - 1 - i] !== expectedSymmetricPos) {
      isSymmetrical = false;
      break;
    }
  }
  
  if (isSymmetrical) return "symmetrical";
  
  // Default
  return "distributed";
}

/**
 * Identify the closest base mode for a given interval pattern
 * @param {Array} intervals - Interval pattern to analyze
 * @returns {String} Base mode name
 */
function identifyBaseMode(intervals) {
  const diatonicPatterns = [
    { pattern: [5, 5, 3, 5, 5, 5, 3], name: "Lydian" },
    { pattern: [5, 3, 5, 5, 5, 3, 5], name: "Ionian" },
    { pattern: [3, 5, 5, 5, 3, 5, 5], name: "Mixolydian" },
    { pattern: [5, 5, 5, 3, 5, 5, 3], name: "Dorian" },
    { pattern: [5, 5, 3, 5, 5, 3, 5], name: "Aeolian" },
    { pattern: [5, 3, 5, 5, 3, 5, 5], name: "Phrygian" },
    { pattern: [3, 5, 5, 3, 5, 5, 5], name: "Locrian" }
  ];
  
  // Check for exact match
  for (const mode of diatonicPatterns) {
    if (arraysEqual(intervals, mode.pattern)) {
      return mode.name;
    }
  }
  
  // Find closest mode
  let closestMode = "Modal";
  let smallestDifference = Infinity;
  
  for (const mode of diatonicPatterns) {
    let difference = 0;
    for (let i = 0; i < 7; i++) {
      difference += Math.abs(intervals[i] - mode.pattern[i]);
    }
    
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestMode = mode.name;
    }
  }
  
  return smallestDifference <= 6 ? closestMode : "Modal";
}

/**
 * Script 2: Variable Cardinality Scale Generator
 * Generates scales with different numbers of notes (from 5 to 9 notes)
 * using a similar flattening approach but with varied starting points
 */

/**
 * Generates scales with varied cardinality (note count)
 * @returns {Array} Collection of scales with different note counts
 */
function generateVariableCardinalityScales() {
  const scales = [];
  
  // Define the cardinalities to generate
  const cardinalities = [5, 6, 8, 9]; // We exclude 7 since we already have heptatonic
  
  for (const cardinality of cardinalities) {
    // Generate a base scale with equal spacing as much as possible
    const baseScale = createEquallySpacedScale(cardinality);
    scales.push(JSON.parse(JSON.stringify(baseScale)));
    
    // Perform flattening operations on this base scale
    const flattenedScales = flattenScale(baseScale, 10); // Limit the depth to avoid explosion
    scales.push(...flattenedScales);
  }
  
  return scales;
}

/**
 * Creates an equally spaced scale with the given number of notes
 * @param {Number} numNotes - Number of notes in the scale (excluding octave)
 * @returns {Object} Base scale with equal spacing
 */
function createEquallySpacedScale(numNotes) {
  const degrees = [0];
  let remainingSteps = OCTAVE;
  
  // Calculate degrees with as equal spacing as possible
  for (let i = 1; i < numNotes; i++) {
    // Constrain to our min/max step rules
    const step = Math.max(MIN_STEP, Math.min(MAX_STEP, Math.round(remainingSteps / (numNotes - i + 1))));
    
    degrees.push(degrees[i-1] + step);
    remainingSteps -= step;
  }
  
  // Add octave
  degrees.push(OCTAVE);
  
  // Calculate intervals
  const intervals = [];
  for (let i = 0; i < numNotes; i++) {
    intervals.push(degrees[i+1] - degrees[i]);
  }
  
  // Create scale object
  const scaleTypes = {
    5: "pentatonic",
    6: "hexatonic",
    8: "octatonic",
    9: "nonatonic"
  };
  
  const uniqueIntervals = new Set(intervals);
  let typePrefix = "";
  
  if (uniqueIntervals.size === 1) {
    typePrefix = "Equi";
  } else if (uniqueIntervals.size === 2) {
    typePrefix = "Iso";
  } else {
    typePrefix = "Hetero";
  }
  
  return {
    degrees: degrees,
    intervals: intervals,
    name: typePrefix + scaleTypes[numNotes],
    description: `Base ${numNotes}-note scale with ${typePrefix.toLowerCase()} spacing.`,
    alterations: [],
    type: scaleTypes[numNotes]
  };
}

/**
 * Flattens a scale using a similar approach as with heptatonic scales
 * @param {Object} baseScale - The base scale to flatten
 * @param {Number} maxDepth - Maximum recursion depth
 * @returns {Array} Collection of flattened scales
 */
function flattenScale(baseScale, maxDepth) {
  const scales = [];
  
  // Recursive function to explore flattening possibilities
  function explore(scale, depth = 0) {
    if (depth >= maxDepth) return;
    
    // Try flattening each note
    for (let i = 0; i < scale.intervals.length; i++) {
      // Skip if the interval is already at minimum
      if (scale.intervals[i] <= MIN_STEP) continue;
      
      // Create a new scale
      const newScale = JSON.parse(JSON.stringify(scale));
      
      // Flatten the note
      newScale.degrees[i+1]--;
      
      // Recalculate intervals
      newScale.intervals[i]--;
      if (i+1 < newScale.intervals.length) {
        newScale.intervals[i+1]++;
      }
      
      // Track the alteration
      const degreeNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
      newScale.alterations.push({
        degree: i+1,
        degreeName: degreeNames[i+1] || `${i+1}th`,
        steps: 1
      });
      
      // Check if all intervals are still valid
      const validIntervals = newScale.intervals.every(interval => 
        interval >= MIN_STEP && interval <= MAX_STEP
      );
      
      if (!validIntervals) continue;
      
      // Create a unique key for this scale
      const scaleKey = newScale.degrees.join(',');
      
      // Check if it's a duplicate
      const isDuplicate = scales.some(existingScale => 
        existingScale.degrees.join(',') === scaleKey
      );
      
      if (!isDuplicate) {
        // Generate name and description
        generateVariableCardinalityScaleName(newScale, baseScale);
        
        // Add to collection
        scales.push(JSON.parse(JSON.stringify(newScale)));
        
        // Continue exploring
        explore(newScale, depth + 1);
      }
    }
  }
  
  // Start exploration
  explore(baseScale);
  
  return scales;
}

/**
 * Generates a name and description for a variable cardinality scale
 * @param {Object} scale - The scale to name
 * @param {Object} baseScale - The original base scale
 */
function generateVariableCardinalityScaleName(scale, baseScale) {
  // Count the unique intervals
  const intervalCounts = {};
  for (const interval of scale.intervals) {
    intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
  }
  
  const uniqueIntervals = Object.keys(intervalCounts).length;
  
  // Determine the prefix based on interval distribution
  let prefix = "";
  if (uniqueIntervals === 1) {
    prefix = "Equi";
  } else if (uniqueIntervals === 2) {
    const intervalTypes = Object.keys(intervalCounts);
    if (intervalTypes.length === 2) {
      prefix = `Iso${intervalTypes[0]}${intervalTypes[1]}`;
    } else {
      prefix = "Iso";
    }
  } else if (intervalCounts[3] && intervalCounts[3] >= 2) {
    prefix = "Soft";
  } else if (intervalCounts[4] && intervalCounts[4] >= 2) {
    prefix = "Neutral";
  } else if (intervalCounts[5] && intervalCounts[5] >= 2) {
    prefix = "Hard";
  } else if (intervalCounts[6] && intervalCounts[6] >= 1) {
    prefix = "Super";
  } else {
    prefix = "Hetero";
  }
  
  // Determine the base type
  const numNotes = scale.degrees.length - 1; // Excluding octave
  const baseTypes = {
    5: "pentatonic",
    6: "hexatonic",
    8: "octatonic",
    9: "nonatonic"
  };
  
  // Add a descriptor based on alterations
  let descriptor = "";
  if (scale.alterations.length === 1) {
    descriptor = "modified ";
  } else if (scale.alterations.length === 2) {
    descriptor = "dual-altered ";
  } else if (scale.alterations.length >= 3) {
    descriptor = "multi-altered ";
  }
  
  // Compile the name
  scale.name = prefix + " " + descriptor + baseTypes[numNotes];
  
  // Generate description
  scale.description = `${numNotes}-note scale derived from ${baseScale.name} by `;
  
  // Group alterations by degree
  const alterationsByDegree = {};
  for (const alt of scale.alterations) {
    alterationsByDegree[alt.degree] = (alterationsByDegree[alt.degree] || 0) + 1;
  }
  
  // Describe the alterations
  const alterationDescriptions = [];
  for (const degree in alterationsByDegree) {
    const steps = alterationsByDegree[degree];
    const degreeNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
    const degreeName = degreeNames[degree] || `${degree}th`;
    
    alterationDescriptions.push(`flattening the ${degreeName} degree by ${steps} step${steps !== 1 ? 's' : ''}`);
  }
  
  if (alterationDescriptions.length === 1) {
    scale.description += alterationDescriptions[0] + ".";
  } else if (alterationDescriptions.length === 2) {
    scale.description += alterationDescriptions.join(" and ") + ".";
  } else {
    const lastAlteration = alterationDescriptions.pop();
    scale.description += alterationDescriptions.join(", ") + ", and " + lastAlteration + ".";
  }
  
  // Add information about the interval structure
  scale.description += ` Contains intervals of ${Object.keys(intervalCounts).join(", ")} steps.`;
}

/**
 * Script 3: Cultural Scale Approximation Generator
 * Generates approximations of various cultural scales in 31-EDO
 */

/**
 * Generates approximations of various cultural scales in 31-EDO
 * @returns {Array} Collection of cultural scale approximations
 */
function generateCulturalScales() {
  const scales = [];
  
  // Add Arabic maqam approximations
  const maqamScales = generateMaqamScales();
  scales.push(...maqamScales);
  
  // Add Indian raga approximations
  const ragaScales = generateRagaScales();
  scales.push(...ragaScales);
  
  // Add blues and jazz scales
  const bluesScales = generateBluesScales();
  scales.push(...bluesScales);
  
  // Add gamelan approximations
  const gamelanScales = generateGamelanScales();
  scales.push(...gamelanScales);
  
  return scales;
}

/**
 * Generates approximations of Arabic maqam scales
 * @returns {Array} Collection of maqam scale approximations
 */
function generateMaqamScales() {
  const scales = [];
  
  // Define some common maqam families in 31-EDO
  const maqamDefinitions = [
    {
      name: "Rast",
      description: "The foundational maqam with neutral third approximation.",
      degrees: [0, 5, 9, 13, 18, 23, 27, 31],
      family: "Rast family",
      origin: "Middle Eastern"
    },
    {
      name: "Bayati",
      description: "Popular maqam with a neutral second.",
      degrees: [0, 4, 9, 13, 18, 22, 27, 31],
      family: "Bayati family",
      origin: "Middle Eastern"
    },
    {
      name: "Hijaz",
      description: "Distinctive maqam with augmented second.",
      degrees: [0, 3, 9, 13, 18, 21, 27, 31],
      family: "Hijaz family",
      origin: "Middle Eastern"
    },
    {
      name: "Saba",
      description: "Expressive maqam with lowered 4th degree.",
      degrees: [0, 3, 6, 12, 18, 21, 27, 31],
      family: "Saba family",
      origin: "Middle Eastern"
    },
    {
      name: "Sikah",
      description: "Maqam built on the neutral 3rd degree.",
      degrees: [0, 4, 9, 14, 18, 22, 27, 31],
      family: "Sikah family",
      origin: "Middle Eastern"
    },
    {
      name: "Nahawand",
      description: "Maqam similar to the Western minor scale.",
      degrees: [0, 3, 8, 13, 18, 21, 26, 31],
      family: "Nahawand family",
      origin: "Middle Eastern"
    }
  ];
  
  // Process each maqam definition
  for (const maqam of maqamDefinitions) {
    // Calculate intervals
    const intervals = [];
    for (let i = 0; i < maqam.degrees.length - 1; i++) {
      intervals.push(maqam.degrees[i+1] - maqam.degrees[i]);
    }
    
    // Create scale object
    const scale = {
      name: "Maqam " + maqam.name,
      description: maqam.description,
      degrees: maqam.degrees,
      intervals: intervals,
      type: "maqam",
      family: maqam.family,
      origin: maqam.origin,
      alterations: []
    };
    
    scales.push(scale);
    
    // Generate variants for each maqam (common modulations/ajnas combinations)
    generateMaqamVariants(scale, scales);
  }
  
  return scales;
}

/**
 * Generates variants for a given maqam (continued)
 * @param {Object} maqam - The base maqam
 * @param {Array} scales - Array to add the variants to
 */
function generateMaqamVariants(maqam, scales) {
  // Define some common modulations and variant patterns for each maqam family
  const variantPatterns = {
    "Rast family": [
      { suffix: " Suznak", modify: [6], by: [-1], description: "Rast with minor 7th" },
      { suffix: " Mahur", modify: [1], by: [1], description: "Rast with major 2nd" }
    ],
    "Bayati family": [
      { suffix: " Shuri", modify: [4], by: [-1], description: "Bayati with minor 5th" },
      { suffix: " Husseini", modify: [3], by: [-1], description: "Bayati with flattened 4th" }
    ],
    "Hijaz family": [
      { suffix: " Kar", modify: [5], by: [-1], description: "Hijaz with minor 6th" },
      { suffix: " Kar-Kurd", modify: [0, 5], by: [0, -1], description: "Hijaz variant with minor 6th" }
    ],
    "Saba family": [
      { suffix: " Zamzam", modify: [5], by: [1], description: "Saba with raised 6th" }
    ],
    "Sikah family": [
      { suffix: " Huzam", modify: [4], by: [-1], description: "Sikah with lowered 5th" }
    ],
    "Nahawand family": [
      { suffix: " Kurd", modify: [1], by: [-1], description: "Nahawand with minor 2nd" }
    ]
  };
  
  // Get patterns for this maqam's family
  const patterns = variantPatterns[maqam.family] || [];
  
  // Create each variant
  for (const pattern of patterns) {
    // Create a copy of the base maqam
    const variant = JSON.parse(JSON.stringify(maqam));
    
    // Apply modifications
    for (let i = 0; i < pattern.modify.length; i++) {
      const degreeIndex = pattern.modify[i];
      const change = pattern.by[i];
      
      // Update degree
      variant.degrees[degreeIndex] += change;
      
      // Track the alteration
      const degreeNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
      variant.alterations.push({
        degree: degreeIndex,
        degreeName: degreeNames[degreeIndex] || `${degreeIndex+1}th`,
        steps: Math.abs(change)
      });
    }
    
    // Recalculate intervals
    recalculateIntervals(variant);
    
    // Check if all intervals are valid
    const validIntervals = variant.intervals.every(interval => 
      interval >= MIN_STEP && interval <= MAX_STEP
    );
    
    if (!validIntervals) continue;
    
    // Update name and description
    variant.name = maqam.name + pattern.suffix;
    variant.description = pattern.description;
    
    // Add to scales collection
    scales.push(variant);
  }
}

/**
 * Generates approximations of Indian raga scales in 31-EDO
 * @returns {Array} Collection of raga scale approximations
 */
function generateRagaScales() {
  const scales = [];
  
  // Define some fundamental ragas (thaat) in 31-EDO
  const ragaDefinitions = [
    {
      name: "Bilawal",
      description: "Equivalent to the Western major scale.",
      degrees: [0, 5, 10, 13, 18, 23, 28, 31],
      family: "Bilawal thaat",
      origin: "North Indian"
    },
    {
      name: "Kafi",
      description: "Similar to Dorian mode with flat 3rd and 7th.",
      degrees: [0, 5, 8, 13, 18, 23, 26, 31],
      family: "Kafi thaat",
      origin: "North Indian"
    },
    {
      name: "Bhairavi",
      description: "Similar to Phrygian mode with all notes flattened except Sa and Pa.",
      degrees: [0, 3, 8, 13, 18, 21, 26, 31],
      family: "Bhairavi thaat",
      origin: "North Indian"
    },
    {
      name: "Kalyan",
      description: "Similar to Lydian mode with sharp 4th.",
      degrees: [0, 5, 10, 15, 18, 23, 28, 31],
      family: "Kalyan thaat",
      origin: "North Indian"
    },
    {
      name: "Marwa",
      description: "Distinctive scale with sharp 4th and flat 2nd and 6th.",
      degrees: [0, 3, 10, 15, 18, 21, 28, 31],
      family: "Marwa thaat",
      origin: "North Indian"
    },
    {
      name: "Poorvi",
      description: "Similar to Marwa but with flat 3rd.",
      degrees: [0, 3, 8, 15, 18, 21, 28, 31],
      family: "Poorvi thaat",
      origin: "North Indian"
    },
    {
      name: "Todi",
      description: "Complex scale with flat 2nd, 3rd, 6th and sharp 4th.",
      degrees: [0, 3, 8, 15, 18, 21, 26, 31],
      family: "Todi thaat",
      origin: "North Indian"
    },
    {
      name: "Mayamalavagowla",
      description: "Fundamental scale in Carnatic music with flat 3rd and 6th.",
      degrees: [0, 5, 8, 13, 18, 21, 26, 31],
      family: "Melakarta raga",
      origin: "South Indian"
    }
  ];
  
  // Add microtonal shrutis for more accurate Raga approximations
  const microtonalRagas = [
    {
      name: "Gandhari",
      description: "Raga with neutral 2nd (11/10 ratio) approximation.",
      degrees: [0, 4, 10, 13, 18, 23, 28, 31],
      family: "Microtonal raga",
      origin: "Indian"
    },
    {
      name: "Kausika",
      description: "Raga with neutral 3rd (27/22 ratio) approximation.",
      degrees: [0, 5, 9, 13, 18, 23, 28, 31],
      family: "Microtonal raga",
      origin: "Indian"
    },
    {
      name: "Pancama",
      description: "Raga with subtle variations in the 5th.",
      degrees: [0, 5, 10, 13, 17, 23, 28, 31],
      family: "Microtonal raga",
      origin: "Indian"
    }
  ];
  
  // Process each raga definition
  const allRagas = [...ragaDefinitions, ...microtonalRagas];
  
  for (const raga of allRagas) {
    // Calculate intervals
    const intervals = [];
    for (let i = 0; i < raga.degrees.length - 1; i++) {
      intervals.push(raga.degrees[i+1] - raga.degrees[i]);
    }
    
    // Create scale object
    const scale = {
      name: "Raga " + raga.name,
      description: raga.description,
      degrees: raga.degrees,
      intervals: intervals,
      type: "raga",
      family: raga.family,
      origin: raga.origin,
      alterations: []
    };
    
    scales.push(scale);
    
    // Generate aroha/avaroha variants (ascending/descending) for select ragas
    if (["Bilawal", "Kafi", "Bhairavi", "Kalyan", "Todi"].includes(raga.name)) {
      generateRagaVariants(scale, scales);
    }
  }
  
  return scales;
}

/**
 * Generates ascending/descending variants for a raga
 * @param {Object} raga - The base raga
 * @param {Array} scales - Array to add the variants to
 */
function generateRagaVariants(raga, scales) {
  // Create ascending (aroha) variant - typically omits certain notes going up
  const aroha = JSON.parse(JSON.stringify(raga));
  aroha.name = raga.name + " Aroha";
  aroha.description = `Ascending form of ${raga.name} with modified note pattern.`;
  
  // Select notes to omit in ascending pattern (typically 4th or 7th)
  let omitIndex;
  if (raga.name === "Kalyan") {
    omitIndex = 3; // Omit the 4th
  } else if (raga.name === "Bhairavi") {
    omitIndex = 6; // Omit the 7th
  } else {
    // Randomly select 3rd or 6th for other ragas
    omitIndex = [2, 5][Math.floor(Math.random() * 2)];
  }
  
  // Remove the note from the degrees array
  aroha.degrees.splice(omitIndex, 1);
  
  // Recalculate intervals
  recalculateIntervals(aroha);
  
  scales.push(aroha);
  
  // Create descending (avaroha) variant - may include additional notes coming down
  const avaroha = JSON.parse(JSON.stringify(raga));
  avaroha.name = raga.name + " Avaroha";
  avaroha.description = `Descending form of ${raga.name} with modified note pattern.`;
  
  // For some ragas, add a chromatic/microtonal passing tone in the descent
  if (["Kalyan", "Todi"].includes(raga.name)) {
    // Add a passing tone between 5th and 4th
    const fifthIndex = 4; // Index of Pa (5th)
    const passingDegree = Math.floor((avaroha.degrees[fifthIndex] + avaroha.degrees[fifthIndex-1]) / 2);
    
    avaroha.degrees.splice(fifthIndex, 0, passingDegree);
    
    // Recalculate intervals
    recalculateIntervals(avaroha);
  }
  
  scales.push(avaroha);
}

/**
 * Generates blues and jazz scale approximations in 31-EDO
 * @returns {Array} Collection of blues and jazz scale approximations
 */
function generateBluesScales() {
  const scales = [];
  
  // Traditional Blues Scale
  const traditionalBlues = {
    name: "Traditional Blues",
    description: "Six-note blues scale with characteristic blue notes.",
    degrees: [0, 3, 8, 13, 18, 23, 31], // 1, b3, 4, b5, 5, b7
    intervals: [3, 5, 5, 5, 5, 8],
    type: "blues",
    origin: "American",
    alterations: []
  };
  scales.push(traditionalBlues);
  
  // Microtonal Blues with neutral 3rd and 7th
  const microtonalBlues = {
    name: "Microtonal Blues",
    description: "Blues scale with neutral thirds and sevenths for more authentic blue notes.",
    degrees: [0, 4, 8, 13, 18, 22, 31], // 1, n3, 4, b5, 5, n7
    intervals: [4, 4, 5, 5, 4, 9],
    type: "blues",
    origin: "American",
    alterations: []
  };
  scales.push(microtonalBlues);
  
  // Quarter-tone Blues
  const quarterToneBlues = {
    name: "Quarter-tone Blues",
    description: "Blues scale incorporating quarter-tone inflections.",
    degrees: [0, 3, 6, 13, 15, 18, 23, 31], // 1, b3, quarter-flat 4, 5, b7
    intervals: [3, 3, 7, 2, 3, 5, 8],
    type: "blues",
    origin: "American/Experimental",
    alterations: []
  };
  scales.push(quarterToneBlues);
  
  // Harmonic Blues
  const harmonicBlues = {
    name: "Harmonic Blues",
    description: "Blues scale featuring harmonically richer intervals.",
    degrees: [0, 5, 8, 13, 18, 21, 28, 31], // 1, M2, m3, 4, 5, m6, M7
    intervals: [5, 3, 5, 5, 3, 7, 3],
    type: "blues",
    origin: "Jazz/Fusion",
    alterations: []
  };
  scales.push(harmonicBlues);
  
  // Debop Scale
  const debop = {
    name: "Debop",
    description: "Jazz scale combining elements of major and minor with added tensions.",
    degrees: [0, 3, 5, 10, 13, 18, 21, 26, 31], // 1, b2, M2, M3, 4, 5, m6, m7
    intervals: [3, 2, 5, 3, 5, 3, 5, 5],
    type: "jazz",
    origin: "Bebop",
    alterations: []
  };
  scales.push(debop);
  
  // Generate microtonal blues variants
  const bluesVariants = generateBluesVariants([traditionalBlues, microtonalBlues]);
  scales.push(...bluesVariants);
  
  return scales;
}

/**
 * Generates variants of blues scales with microtonal inflections
 * @param {Array} baseScales - Array of base blues scales
 * @returns {Array} Collection of blues scale variants
 */
function generateBluesVariants(baseScales) {
  const variants = [];
  
  for (const blues of baseScales) {
    // Add a version with "blue third" (between minor and major third)
    const blueThird = JSON.parse(JSON.stringify(blues));
    blueThird.name = "Blue Third " + blues.name;
    blueThird.description = `${blues.name} with characteristic blue third (neutral third).`;
    
    // Find the index of the third (either minor or major)
    const thirdIndex = 1; // Assuming the third is at index 1
    blueThird.degrees[thirdIndex] = 4; // Set to neutral third (4/31)
    
    // Recalculate intervals
    recalculateIntervals(blueThird);
    
    variants.push(blueThird);
    
    // Add a version with "blue seventh" (between minor and major seventh)
    const blueSeventh = JSON.parse(JSON.stringify(blues));
    blueSeventh.name = "Blue Seventh " + blues.name;
    blueSeventh.description = `${blues.name} with characteristic blue seventh (neutral seventh).`;
    
    // Find the index of the seventh
    const seventhIndex = blues.degrees.length - 2; // Second to last degree
    blueSeventh.degrees[seventhIndex] = 26; // Neutral seventh (26/31)
    
    // Recalculate intervals
    recalculateIntervals(blueSeventh);
    
    variants.push(blueSeventh);
    
    // Add a version with "blue fifth" (quarter-tone flat five)
    const blueFifth = JSON.parse(JSON.stringify(blues));
    blueFifth.name = "Blue Fifth " + blues.name;
    blueFifth.description = `${blues.name} with characteristic blue fifth (quarter-tone flat five).`;
    
    // Find the index of the fifth
    let fifthIndex = -1;
    for (let i = 0; i < blues.degrees.length; i++) {
      if (blues.degrees[i] === 18) { // Perfect fifth is 18/31
        fifthIndex = i;
        break;
      }
    }
    
    if (fifthIndex !== -1) {
      blueFifth.degrees[fifthIndex] = 17; // Quarter-tone flat fifth (17/31)
      
      // Recalculate intervals
      recalculateIntervals(blueFifth);
      
      variants.push(blueFifth);
    }
  }
  
  return variants;
}

/**
 * Generates approximations of Gamelan scales in 31-EDO
 * @returns {Array} Collection of gamelan scale approximations
 */
function generateGamelanScales() {
  const scales = [];
  
  // Approximations of Pelog scale
  const pelog = {
    name: "Pelog",
    description: "Approximation of the 7-tone Javanese Pelog scale.",
    degrees: [0, 2, 7, 12, 18, 21, 26, 31], // Approximate Pelog intervals
    intervals: [2, 5, 5, 6, 3, 5, 5],
    type: "gamelan",
    origin: "Javanese",
    alterations: []
  };
  scales.push(pelog);
  
  // Pelog Bem variant
  const pelogBem = {
    name: "Pelog Bem",
    description: "Pelog Bem variant (pathet bem) of the Javanese gamelan scale.",
    degrees: [0, 2, 7, 12, 18, 26, 31], // Excludes one note from the full Pelog
    intervals: [2, 5, 5, 6, 8, 5],
    type: "gamelan",
    origin: "Javanese",
    alterations: []
  };
  scales.push(pelogBem);
  
  // Pelog Barang variant
  const pelogBarang = {
    name: "Pelog Barang",
    description: "Pelog Barang variant (pathet barang) of the Javanese gamelan scale.",
    degrees: [0, 2, 7, 18, 21, 26, 31], // Different subset of Pelog
    intervals: [2, 5, 11, 3, 5, 5],
    type: "gamelan",
    origin: "Javanese",
    alterations: []
  };
  scales.push(pelogBarang);
  
  // Approximations of Slendro scale
  const slendro = {
    name: "Slendro",
    description: "Approximation of the 5-tone Javanese Slendro scale with roughly equal divisions.",
    degrees: [0, 6, 12, 19, 25, 31], // Approximate Slendro intervals
    intervals: [6, 6, 7, 6, 6],
    type: "gamelan",
    origin: "Javanese",
    alterations: []
  };
  scales.push(slendro);
  
  // Balinese Pelog
  const balinesePelog = {
    name: "Balinese Pelog",
    description: "Approximation of the Balinese Pelog scale, which differs from Javanese Pelog.",
    degrees: [0, 3, 7, 14, 18, 21, 26, 31],
    intervals: [3, 4, 7, 4, 3, 5, 5],
    type: "gamelan",
    origin: "Balinese",
    alterations: []
  };
  scales.push(balinesePelog);
  
  // Sundanese (West Java) scales
  const sundanese = {
    name: "Sundanese Pelog",
    description: "Approximation of the West Javanese Sundanese Pelog scale.",
    degrees: [0, 4, 8, 13, 18, 22, 26, 31],
    intervals: [4, 4, 5, 5, 4, 4, 5],
    type: "gamelan",
    origin: "Sundanese",
    alterations: []
  };
  scales.push(sundanese);
  
  return scales;
}

/**
 * Helper function to recalculate intervals
 * @param {Object} scale - Scale to recalculate intervals for
 */
function recalculateIntervals(scale) {
  const intervals = [];
  for (let i = 0; i < scale.degrees.length - 1; i++) {
    intervals.push(scale.degrees[i+1] - scale.degrees[i]);
  }
  scale.intervals = intervals;
}

/**
 * Helper function to check if arrays are equal
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Boolean} True if arrays are equal
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Main function to generate all scale families
 * @returns {Object} All generated scale collections
 */
function generateAllScales() {
  const allScales = {
    nonSequentialHeptatonic: generateNonSequentialHeptatonicScales(),
    variableCardinality: generateVariableCardinalityScales(),
    cultural: generateCulturalScales()
  };
  
  // Calculate statistics
  const stats = {
    totalScales: 0,
    byFamily: {}
  };
  
  for (const family in allScales) {
    stats.totalScales += allScales[family].length;
    stats.byFamily[family] = allScales[family].length;
  }
  
  return {
    scales: allScales,
    stats: stats
  };
}

// Run the generation
const result = generateAllScales();
console.log(`Generated ${result.stats.totalScales} total scales`);
console.log("Scale counts by family:");
for (const family in result.stats.byFamily) {
  console.log(`  ${family}: ${result.stats.byFamily[family]}`);
}

// Print sample scales from each family
console.log("\nSample Non-Sequential Heptatonic Scales:");
for (let i = 0; i < Math.min(3, result.scales.nonSequentialHeptatonic.length); i++) {
  const scale = result.scales.nonSequentialHeptatonic[i];
  console.log(`${scale.name}: [${scale.degrees.join(", ")}]`);
  console.log(`Description: ${scale.description}`);
  console.log("---");
}

console.log("\nSample Variable Cardinality Scales:");
for (let i = 0; i < Math.min(3, result.scales.variableCardinality.length); i++) {
  const scale = result.scales.variableCardinality[i];
  console.log(`${scale.name}: [${scale.degrees.join(", ")}]`);
  console.log(`Description: ${scale.description}`);
  console.log("---");
}

console.log("\nSample Cultural Scales:");
for (let i = 0; i < Math.min(3, result.scales.cultural.length); i++) {
  const scale = result.scales.cultural[i];
  console.log(`${scale.name}: [${scale.degrees.join(", ")}]`);
  console.log(`Description: ${scale.description}`);
  console.log(`Type: ${scale.type}, Origin: ${scale.origin}`);
  console.log("---");
}

// Export as JSON
console.log(JSON.stringify(result.scales, null, 2));
fs.writeFileSync('public/data/culturalEtc.json', JSON.stringify(result.scales, null, 2));