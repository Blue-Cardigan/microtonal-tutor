/**
 * IntervalUtils.js
 * Utility functions for working with intervals in 31-EDO
 */

// Constants
export const STEPS_PER_OCTAVE = 31;
export const CENTS_PER_OCTAVE = 1200;
export const CENTS_PER_STEP = CENTS_PER_OCTAVE / STEPS_PER_OCTAVE;

// 31-EDO note names
const NOTE_NAMES = [
    "C", "D♭♭", "C♯", "D♭", "C×", "D", "E♭♭", "D♯", "E♭", "D×", "E", 
    "F♭", "E♯", "F", "G♭♭", "F♯", "G♭", "F×", "G", "A♭♭", "G♯", 
    "A♭", "G×", "A", "B♭♭", "A♯", "B♭", "A×", "B", "C♭", "B♯"
];

/**
 * Convert a step to cents
 * @param {number} step - The step to convert
 * @returns {number} The cents value
 */
export function stepToCents(step) {
    return step * CENTS_PER_STEP;
}

/**
 * Convert cents to a step
 * @param {number} cents - The cents to convert
 * @returns {number} The step value
 */
export function centsToStep(cents) {
    return cents / CENTS_PER_STEP;
}

/**
 * Get the note name for a step
 * @param {number} step - The step to get the name for
 * @returns {string} The note name
 */
export function getStepNoteName(step) {
    // Calculate the octave
    const octave = Math.floor(step / STEPS_PER_OCTAVE) + 4; // Start at octave 4 (middle C)
    
    // Calculate the note within the octave
    const noteIndex = step % STEPS_PER_OCTAVE;
    
    // Get the note name
    const noteName = NOTE_NAMES[noteIndex];
    
    // Return the note name with the octave
    return `${noteName}${octave}`;
}

/**
 * Format a camelCase string to Title Case with spaces
 * @param {string} camelCase - String in camelCase
 * @returns {string} Formatted string in Title Case with spaces
 */
export function formatName(camelCase) {
    return camelCase
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

/**
 * Find the closest just intonation ratio for a given step
 * @param {number} step - The step to find the ratio for
 * @param {Array} excludeRatios - Optional array of ratios to exclude from consideration
 * @returns {Object} An object with the ratio, cents, and deviation
 */
export function findClosestJustRatio(step, excludeRatios = []) {
    // Convert the step to cents
    const stepCents = stepToCents(step);
    
    // Define primary just intonation ratios
    const justRatios = [
        { ratio: "1:1", name: "Unison", cents: 0 },
        { ratio: "16:15", name: "Diatonic Semitone", cents: 111.73 },
        { ratio: "9:8", name: "Major Tone", cents: 203.91 },
        { ratio: "8:7", name: "Septimal Whole Tone", cents: 231.17 },
        { ratio: "7:6", name: "Septimal Minor Third", cents: 266.87 },
        { ratio: "6:5", name: "Minor Third", cents: 315.64 },
        { ratio: "5:4", name: "Major Third", cents: 386.31 },
        { ratio: "9:7", name: "Septimal Major Third", cents: 435.08 },
        { ratio: "4:3", name: "Perfect Fourth", cents: 498.04 },
        { ratio: "7:5", name: "Lesser Septimal Tritone", cents: 582.51 },
        { ratio: "3:2", name: "Perfect Fifth", cents: 701.96 },
        { ratio: "8:5", name: "Minor Sixth", cents: 813.69 },
        { ratio: "5:3", name: "Major Sixth", cents: 884.36 },
        { ratio: "7:4", name: "Harmonic Seventh", cents: 968.83 },
        { ratio: "9:5", name: "Minor Seventh", cents: 1017.60 },
        { ratio: "15:8", name: "Major Seventh", cents: 1088.27 },
        { ratio: "2:1", name: "Octave", cents: 1200 }
    ];

    // Define secondary just intonation ratios
    const secondaryJustRatios = [
        { ratio: "128:125", name: "Lesser Diesis", cents: 41.06 },
        { ratio: "45:44", name: "Undecimal Diesis", cents: 38.91 },
        { ratio: "49:48", name: "Septimal Diesis", cents: 35.70 },
        { ratio: "21:20", name: "Septimal Chromatic Semitone", cents: 84.47 },
        { ratio: "25:24", name: "Chromatic Semitone", cents: 70.67 },
        { ratio: "15:14", name: "Septimal Diatonic Semitone", cents: 119.44 },
        { ratio: "11:10", name: "Greater Undecimal Neutral Second", cents: 165.00 },
        { ratio: "12:11", name: "Lesser Undecimal Neutral Second", cents: 150.64 },
        { ratio: "28:25", name: "Whole Tone", cents: 196.20 },
        { ratio: "10:9", name: "Minor Tone", cents: 182.40 },
        { ratio: "16:13", name: "Tridecimal Neutral Third", cents: 359.47 },
        { ratio: "11:9", name: "Undecimal Neutral Third", cents: 347.41 },
        { ratio: "32:25", name: "Diminished Fourth", cents: 427.37 },
        { ratio: "14:11", name: "Undecimal Major Third", cents: 417.51 },
        { ratio: "21:16", name: "Septimal Narrow Fourth", cents: 470.78 },
        { ratio: "13:10", name: "Tridecimal Augmented Third", cents: 454.21 },
        { ratio: "11:8", name: "Undecimal Tritone", cents: 551.32 },
        { ratio: "10:7", name: "Greater Septimal Tritone", cents: 617.49 },
        { ratio: "16:9", name: "Grave Just Minor Seventh", cents: 996.09 }
    ];
    
    // Filter out excluded ratios from primary list
    const filteredPrimaryRatios = justRatios.filter(ratio => !excludeRatios.includes(ratio.ratio));
    
    // Find the closest primary ratio
    let closestPrimaryRatio = filteredPrimaryRatios[0];
    let minPrimaryDeviation = Math.abs(stepCents - filteredPrimaryRatios[0].cents);
    
    for (let i = 1; i < filteredPrimaryRatios.length; i++) {
        const deviation = Math.abs(stepCents - filteredPrimaryRatios[i].cents);
        if (deviation < minPrimaryDeviation) {
            minPrimaryDeviation = deviation;
            closestPrimaryRatio = filteredPrimaryRatios[i];
        }
    }
    
    // Filter out excluded ratios from secondary list
    const filteredSecondaryRatios = secondaryJustRatios.filter(ratio => !excludeRatios.includes(ratio.ratio));
    
    // Find the closest secondary ratio
    let closestSecondaryRatio = null;
    let minSecondaryDeviation = Infinity;
    
    for (let i = 0; i < filteredSecondaryRatios.length; i++) {
        const deviation = Math.abs(stepCents - filteredSecondaryRatios[i].cents);
        if (deviation < minSecondaryDeviation) {
            minSecondaryDeviation = deviation;
            closestSecondaryRatio = filteredSecondaryRatios[i];
        }
    }
    
    // Return the closest primary ratio with the deviation and secondary ratio info if it's closer
    return {
        ratio: closestPrimaryRatio.ratio,
        name: closestPrimaryRatio.name,
        cents: closestPrimaryRatio.cents,
        deviation: minPrimaryDeviation,
        secondaryRatio: minSecondaryDeviation < minPrimaryDeviation ? {
            ratio: closestSecondaryRatio.ratio,
            name: closestSecondaryRatio.name,
            cents: closestSecondaryRatio.cents,
            deviation: minSecondaryDeviation
        } : null
    };
}

// Define interval names for 31-EDO
export const INTERVAL_NAMES = {
    0: "Perfect Unison",
    1: "Super Unison",
    2: "Augmented Unison", 
    3: "Minor Second",
    4: "Neutral Second",
    5: "Major Second",
    6: "Supermajor Second",
    7: "Subminor Third",
    8: "Minor Third",
    9: "Neutral Third",
    10: "Major Third",
    11: "Supermajor Third",
    12: "Sub Fourth",
    13: "Perfect Fourth",
    14: "Super Fourth",
    15: "Augmented Fourth",
    16: "Diminished Fifth",
    17: "Sub Fifth",
    18: "Perfect Fifth",
    19: "Super Fifth",
    20: "Subminor Sixth",
    21: "Minor Sixth",
    22: "Neutral Sixth",
    23: "Major Sixth",
    24: "Supermajor Sixth",
    25: "Harmonic Seventh",
    26: "Minor Seventh",
    27: "Neutral Seventh",
    28: "Major Seventh",
    29: "Supermajor Seventh",
    30: "Sub Octave",
    31: "Perfect Octave"
};

// Define consonance ratings for each interval in 31-EDO
// Scale from 0 (most dissonant) to 10 (most consonant)
export const CONSONANCE_RATINGS = {
    0: 10.0,  // Perfect Unison - most consonant
    1: 1.0,   // Super Unison - very dissonant
    2: 0.5,   // Augmented Unison - very dissonant
    3: 1.0,   // Minor Second - very dissonant
    4: 1.5,   // Neutral Second - very dissonant
    5: 2.0,   // Major Second - dissonant
    6: 1.5,   // Supermajor Second - very dissonant
    7: 2.0,   // Subminor Third - dissonant
    8: 7.0,   // Minor Third - consonant
    9: 6.0,   // Neutral Third - somewhat consonant
    10: 8.0,  // Major Third - very consonant
    11: 5.0,  // Supermajor Third - somewhat consonant
    12: 5.5,  // Sub Fourth - somewhat consonant
    13: 8.5,  // Perfect Fourth - very consonant
    14: 5.0,  // Super Fourth - somewhat consonant
    15: 4.0,  // Augmented Fourth - somewhat dissonant
    16: 4.0,  // Diminished Fifth - somewhat dissonant
    17: 5.0,  // Sub Fifth - somewhat consonant
    18: 9.0,  // Perfect Fifth - extremely consonant
    19: 6.0,  // Super Fifth - consonant
    20: 5.5,  // Subminor Sixth - somewhat consonant
    21: 7.5,  // Minor Sixth - consonant
    22: 6.5,  // Neutral Sixth - consonant
    23: 8.0,  // Major Sixth - very consonant
    24: 5.5,  // Supermajor Sixth - somewhat consonant
    25: 6.0,  // Harmonic Seventh - consonant
    26: 6.5,  // Minor Seventh - consonant
    27: 5.5,  // Neutral Seventh - somewhat consonant
    28: 5.0,  // Major Seventh - somewhat consonant
    29: 3.0,  // Supermajor Seventh - dissonant
    30: 2.0,  // Sub Octave - dissonant
    31: 10.0  // Perfect Octave - most consonant
};

/**
 * Get the consonance rating for an interval
 * @param {number} steps - The number of steps in the interval
 * @returns {number} The consonance rating (0-10)
 */
export function getConsonanceRating(steps) {
    // Normalize steps to be within an octave
    const normalizedSteps = steps % STEPS_PER_OCTAVE;
    return CONSONANCE_RATINGS[normalizedSteps] || 0;
}

/**
 * Calculate the overall consonance of a set of notes
 * @param {Array|Set} notes - The notes to calculate consonance for
 * @returns {Object} An object with the overall consonance rating and details
 */
export function calculateOverallConsonance(notes) {
    if (!notes || notes.length < 2) {
        return { rating: 0, intervalRatings: [], description: "N/A" };
    }
    
    // Convert to array if it's a Set or Map
    const notesArray = Array.isArray(notes) ? notes : Array.from(notes instanceof Map ? notes.values() : notes);
    
    // Calculate all interval pairs
    const intervalRatings = [];
    let totalRating = 0;
    let intervalCount = 0;
    
    for (let i = 0; i < notesArray.length; i++) {
        for (let j = i + 1; j < notesArray.length; j++) {
            const note1 = notesArray[i];
            const note2 = notesArray[j];
            
            // Calculate the interval in steps (always positive and within an octave)
            const rawSteps = Math.abs(note2 - note1);
            const steps = rawSteps % STEPS_PER_OCTAVE;
            
            // Get the consonance rating
            const rating = getConsonanceRating(steps);
            
            // Add to the total
            totalRating += rating;
            intervalCount++;
            
            // Store the interval rating
            intervalRatings.push({
                note1,
                note2,
                steps,
                rating
            });
        }
    }
    
    // Calculate the average rating
    const averageRating = intervalCount > 0 ? totalRating / intervalCount : 0;
    
    // Determine a description based on the average rating
    let description;
    if (averageRating >= 9) {
        description = "Extremely Consonant";
    } else if (averageRating >= 8) {
        description = "Very Consonant";
    } else if (averageRating >= 7) {
        description = "Consonant";
    } else if (averageRating >= 6) {
        description = "Moderately Consonant";
    } else if (averageRating >= 5) {
        description = "Somewhat Consonant";
    } else if (averageRating >= 4) {
        description = "Somewhat Dissonant";
    } else if (averageRating >= 3) {
        description = "Moderately Dissonant";
    } else if (averageRating >= 2) {
        description = "Dissonant";
    } else if (averageRating >= 1) {
        description = "Very Dissonant";
    } else {
        description = "Extremely Dissonant";
    }
    
    return {
        rating: averageRating,
        intervalRatings,
        description
    };
}