'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAudio } from '../utils/AudioContext';
import { formatName } from '../utils/IntervalUtils';
import * as Tone from 'tone';

interface Chord {
  degree: number;
  degreeRoman: string;
  type: string;
  function: string;
  notes: number[];
  intervals: number[];
}

interface Scale {
  name: string;
  degrees: number[];
  intervals: number[];
  modifications: string[];
  description?: string;
  properties?: {
    [key: string]: string | number | boolean;
  };
  categories: {
    [key: string]: string[];
  };
  chordSystem: {
    chordsByDegree: {
      [key: string]: {
        name: string;
        chords: Chord[];
      }[];
    };
    chordsByFunction: {
      [key: string]: {
        name: string;
        chords: Chord[];
      }[];
    };
  };
}

interface ScaleFamily {
  name: string;
  scales: Scale[];
}

interface ScaleData {
  title: string;
  families: {
    [key: string]: ScaleFamily;
  };
}

interface ScaleBrowserProps {
  onHighlightNotes?: (notes: Set<number>) => void;
  onChordSelect?: (chord: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null) => void;
  onScaleSelect?: (scale: {
    name: string;
    degrees: number[];
  } | null) => void;
}

// Define Roman numeral mapping
const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
const ROMAN_NUMERALS_MAJOR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Define 31-EDO interval classifications
const getIntervalType = (interval: number): string => {
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
    case 25: return "harmonic seventh";
    case 26: return "minor seventh";
    case 27: return "neutral seventh";
    case 28: return "major seventh";
    
    default: return "unknown";
  }
};

// Function to determine chord function based on scale degree
const getFunctionFromDegree = (degree: number, isMajorLike: boolean): string => {
  // Basic functional harmony assignments
  if (degree === 0) return "Tonic";
  if (degree === 4) return "Dominant";
  if (degree === 3) return "Subdominant";
  
  // Different assignments for major vs minor modes
  if (isMajorLike) {
    if (degree === 2) return "Supertonic";
    if (degree === 5) return "Submediant";
    if (degree === 1) return "Mediant";
    if (degree === 6) return "Leading Tone";
  } else {
    if (degree === 1) return "Supertonic";
    if (degree === 5) return "Dominant";
    if (degree === 2) return "Mediant";
    if (degree === 6) return "Subtonic";
  }
  
  return "Unknown";
};

// Enhanced function to determine chord type based on intervals in 31-EDO
const getChordType = (intervals: number[]): string => {
  if (intervals.length === 0) return "single note";
  if (intervals.length === 1) {
    // For dyads (two-note chords), classify based on the interval
    const interval = intervals[0];
    if (interval <= 6) return "second";
    if (interval <= 11) return "third";
    if (interval <= 14) return "fourth";
    if (interval <= 16) return "tritone";
    if (interval <= 19) return "fifth";
    if (interval <= 24) return "sixth";
    if (interval <= 28) return "seventh";
    return "octave+";
  }
  
  // For triads
  if (intervals.length === 2) {
    const third = intervals[0];
    const fifth = intervals[1];
    
    // Standard triads with perfect fifth (18 steps)
    if (fifth === 18 || (fifth >= 17 && fifth <= 19)) {
      if (third === 7) return "subminor"; // Subminor third (7 steps)
      if (third === 8) return "minor";    // Minor third (8 steps)
      if (third === 9) return "neutral";  // Neutral third (9 steps)
      if (third === 10) return "major";   // Major third (10 steps)
      if (third === 11) return "supermajor"; // Supermajor third (11 steps)
      
      // More flexible matching
      if (third >= 7 && third < 8.5) return "subminor";
      if (third >= 8.5 && third < 9.5) return "minor";
      if (third >= 9.5 && third < 10.5) return "neutral";
      if (third >= 10.5) return "supermajor";
    }
    
    // Augmented triads (fifth = 19 steps)
    if (fifth >= 19) {
      if (third === 8) return "minor augmented"; // Minor third with augmented fifth
      if (third === 9) return "neutral augmented"; // Neutral third with augmented fifth
      if (third === 10) return "augmented";     // Major third with augmented fifth
      if (third === 11) return "supermajor augmented"; // Supermajor third with augmented fifth
      
      // More flexible matching
      if (third >= 7 && third < 8.5) return "subminor augmented";
      if (third >= 8.5 && third < 9.5) return "minor augmented";
      if (third >= 9.5 && third < 10.5) return "neutral augmented";
      if (third >= 10.5) return "augmented";
    }
    
    // Diminished triads (fifth = 17 steps)
    if (fifth <= 17) {
      if (third === 7) return "subminor diminished"; // Subminor third with diminished fifth
      if (third === 8) return "diminished";  // Minor third with diminished fifth
      if (third === 9) return "neutral diminished"; // Neutral third with diminished fifth
      if (third === 10) return "major diminished"; // Major third with diminished fifth
      
      // More flexible matching
      if (third >= 7 && third < 8.5) return "subminor diminished";
      if (third >= 8.5 && third < 9.5) return "diminished";
      if (third >= 9.5 && third < 10.5) return "neutral diminished";
      if (third >= 10.5) return "major diminished";
    }
    
    // Special cases for other fifths
    if (fifth <= 16 && third >= 7 && third <= 9) return "double diminished"; // Minor third with double diminished fifth
    if (fifth >= 20 && third >= 9 && third <= 11) return "double augmented"; // Major third with double augmented fifth
    
    // Harmonic triads
    if (third === 7 && fifth === 16) return "harmonic diminished"; // 5:6:7 ratio
    if (third === 7 && fifth === 18) return "subminor"; // 6:7:9 ratio
    if (third === 9 && fifth === 18) return "neutral"; // 18:22:27 ratio
    if (third === 11 && fifth === 18) return "supermajor"; // 9:11:14 ratio
    
    // If no specific name, use the interval types
    return `${getIntervalType(third)}-${getIntervalType(fifth)}`;
  }
  
  // For seventh chords
  if (intervals.length === 3) {
    const third = intervals[0];
    const fifth = intervals[1];
    const seventh = intervals[2];
    
    // Identify the triad type first
    let triadType = "";
    
    if ((third >= 7 && third < 8) && (fifth >= 17 && fifth <= 19)) triadType = "subminor";
    else if ((third >= 8 && third < 9) && (fifth >= 17 && fifth <= 19)) triadType = "minor";
    else if ((third >= 9 && third < 10) && (fifth >= 17 && fifth <= 19)) triadType = "neutral";
    else if ((third >= 10 && third < 11) && (fifth >= 17 && fifth <= 19)) triadType = "major";
    else if ((third >= 11) && (fifth >= 17 && fifth <= 19)) triadType = "supermajor";
    else if ((third >= 8 && third < 9) && fifth <= 17) triadType = "diminished";
    else if ((third >= 10 && third < 11) && fifth >= 19) triadType = "augmented";
    else triadType = `${getIntervalType(third)}-${getIntervalType(fifth)}`;
    
    // Special named seventh chords
    
    // Harmonic seventh chord (4:5:6:7)
    if (third >= 10 && third <= 11 && fifth >= 17 && fifth <= 19 && seventh >= 24 && seventh <= 26) return "harmonic 7";
    
    // Undecimal tetrad (6:7:9:11)
    if (third >= 7 && third <= 8 && fifth >= 17 && fifth <= 19 && seventh >= 26 && seventh <= 28) return "undecimal tetrad";
    
    // Utonal tetrad (12/10/8/7)
    if (third >= 8 && third <= 9 && fifth >= 17 && fifth <= 19 && seventh >= 19 && seventh <= 21) return "utonal tetrad";
    
    // 9-over tetrad (9/7/6/5)
    if (third >= 11 && fifth >= 17 && fifth <= 19 && seventh >= 25 && seventh <= 27) return "9-over tetrad";
    
    // Standard seventh chord types with more flexible matching
    if (triadType === "major" && seventh >= 27 && seventh <= 29) return "major 7";
    if (triadType === "major" && seventh >= 25 && seventh < 27) return "dominant 7";
    if (triadType === "minor" && seventh >= 25 && seventh < 27) return "minor 7";
    if (triadType === "diminished" && seventh >= 25 && seventh < 27) return "half-diminished 7";
    if (triadType === "diminished" && seventh >= 24 && seventh < 25) return "diminished 7";
    if (triadType === "neutral" && seventh >= 26 && seventh < 28) return "neutral dominant 7";
    if (triadType === "neutral" && seventh >= 25 && seventh < 26) return "neutral minor 7";
    if (triadType === "subminor" && seventh >= 24 && seventh < 26) return "subminor 7";
    if (triadType === "subminor" && seventh >= 26 && seventh < 28) return "subminor neutral 7";
    if (triadType === "supermajor" && seventh >= 27 && seventh < 29) return "supermajor 7";
    if (triadType === "supermajor" && seventh >= 25 && seventh < 27) return "supermajor minor 7";
    
    // If no specific name, combine triad type with seventh type
    return `${triadType} ${getIntervalType(seventh)} 7`;
  }
  
  // For extended chords (9ths, 11ths, 13ths)
  if (intervals.length > 3) {
    // Identify special extended chords
    
    // Otonality (4:5:6:7:9:11)
    if (intervals.length >= 5 && 
        intervals[0] >= 10 && intervals[0] <= 11 && 
        intervals[1] >= 17 && intervals[1] <= 19 && 
        intervals[2] >= 24 && intervals[2] <= 26 && 
        intervals[3] >= 27 && intervals[3] <= 29) {
      return intervals.length === 5 ? "otonality (9)" : "otonality (11)";
    }
    
    // Extended harmonic series chord
    if (intervals.length >= 5 && 
        intervals[0] >= 10 && intervals[0] <= 11 && 
        intervals[1] >= 17 && intervals[1] <= 19 && 
        intervals[2] >= 24 && intervals[2] <= 26) {
      return `harmonic ${intervals.length + 1}`;
    }
    
    // Default to base seventh chord with extensions
    const seventhChordType = getChordType(intervals.slice(0, 3));
    return `${seventhChordType} with extensions`;
  }
  
  return "unknown";
};

const ScaleBrowser = ({ onHighlightNotes, onChordSelect, onScaleSelect }: ScaleBrowserProps) => {
  const { playNote, stopAllNotes, scheduleNote, isLoaded } = useAudio();
  const [scaleData, setScaleData] = useState<ScaleData | null>(null);
  const [families, setFamilies] = useState<string[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [scaleIndex, setScaleIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
  const [highlightedNotes, setHighlightedNotes] = useState<Set<number>>(new Set());
  const [generatedChords, setGeneratedChords] = useState<{triads: Chord[], sevenths: Chord[]}>({
    triads: [],
    sevenths: []
  });
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [useSeventhChords, setUseSeventhChords] = useState<boolean>(false);
  const [currentInversion, setCurrentInversion] = useState<number>(0);
  const [useAutoInversion, setUseAutoInversion] = useState<boolean>(false);
  const [actualAutoInversion, setActualAutoInversion] = useState<number>(0);
  
  // New state variables for enhanced filtering and searching
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filteredScales, setFilteredScales] = useState<Scale[]>([]);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [sortBy, setSortBy] = useState<'name' | 'noteCount' | 'brightness'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Reference to track scheduled event IDs for cleanup
  const scheduledEventsRef = useRef<number[]>([]);
  
  // Function to clear all scheduled events
  const clearAllScheduledEvents = useCallback(() => {
    scheduledEventsRef.current.forEach(eventId => {
      Tone.Transport.clear(eventId);
    });
    scheduledEventsRef.current = [];
  }, []);
  
  // Function to safely update highlighted notes
  const updateHighlightedNotes = useCallback((notes: Set<number>) => {
    setHighlightedNotes(notes);
    if (onHighlightNotes) {
      onHighlightNotes(notes);
    }
  }, [onHighlightNotes]);
  
  // Function to find the inversion with the lowest bass note
  const findOptimalInversion = useCallback((notes: number[]): number => {
    if (notes.length <= 1) return 0; // No inversion needed for single notes
    
    // First, normalize all notes to be within a single octave range (0-30)
    // But preserve high C (31) as distinct from C (0)
    const normalizedNotes = notes.map(note => {
      // Special handling for high C (31) - keep it as 31 instead of normalizing to 0
      if (note % 31 === 0 && note !== 0) {
        return 31;
      }
      return note % 31;
    });
    
    let lowestBassNote = Number.MAX_SAFE_INTEGER;
    let optimalInversion = 0;
    
    // Try each possible inversion and find the one with the lowest bass note
    for (let inv = 0; inv < notes.length; inv++) {
      // Create a copy of the normalized notes array for this inversion
      const invertedNotes = [...normalizedNotes];
      
      // Apply the inversion
      for (let i = 0; i < inv; i++) {
        const firstNote = invertedNotes.shift() as number;
        invertedNotes.push(firstNote); // No need to add octave since we're working with normalized notes
      }
      
      // Check if this inversion has a lower bass note
      if (invertedNotes[0] < lowestBassNote) {
        lowestBassNote = invertedNotes[0];
        optimalInversion = inv;
      }
    }
    
    return optimalInversion;
  }, []);
  
  // Function to invert a chord
  const invertChord = useCallback((notes: number[], inversion: number, autoInversionValue?: number): number[] => {
    if (notes.length <= 1) return [...notes]; // No inversion needed
    
    // If auto inversion is enabled, find the optimal inversion and normalize notes
    if (useAutoInversion) {
      // Use the provided autoInversionValue if available, otherwise calculate it
      const optimalInversion = autoInversionValue !== undefined ? autoInversionValue : findOptimalInversion(notes);
      
      // First normalize all notes to be within a single octave (0-30)
      // But preserve high C (31) as distinct from C (0)
      const normalizedNotes = notes.map(note => {
        // Special handling for high C (31) - keep it as 31 instead of normalizing to 0
        if (note % 31 === 0 && note !== 0) {
          return 31;
        }
        return note % 31;
      });
      
      // Apply the optimal inversion
      const invertedNotes = [...normalizedNotes];
      for (let i = 0; i < optimalInversion; i++) {
        const firstNote = invertedNotes.shift() as number;
        invertedNotes.push(firstNote);
      }
      
      // Place the notes in a reasonable octave range
      const baseOctave = 0; // C0 range (lowest possible)
      return invertedNotes.map(note => {
        // If it's a high C (31), keep it as the next octave's C
        if (note === 31) {
          return baseOctave * 31 + 31;
        }
        return note + (baseOctave * 31);
      });
    }
    
    // For manual inversions, use the original approach
    // If no inversion needed, return the original notes
    if (inversion === 0) return [...notes];
    
    // Make a copy of the notes array
    const invertedNotes = [...notes];
    
    // Apply the inversion (move notes to the next octave)
    for (let i = 0; i < inversion && i < notes.length; i++) {
      // Move the first note up an octave and place it at the end
      const firstNote = invertedNotes.shift() as number;
      invertedNotes.push(firstNote + 31); // Add an octave (31 steps in 31-EDO)
    }
    
    return invertedNotes;
  }, [useAutoInversion, findOptimalInversion]);
  
  // Define playChord and stopChord functions first (before they're used in useEffect)
  const playChord = useCallback((chord: Chord) => {
    if (!isLoaded) return;
    
    // Clear any existing scheduled events
    clearAllScheduledEvents();
    
    // Set the new selected chord immediately for UI updates
    setSelectedChord(chord);
    
    // Notify parent component about selected chord if callback exists
    if (onChordSelect) {
      onChordSelect({
        notes: chord.notes,
        type: chord.type,
        degreeRoman: chord.degreeRoman
      });
    }
    
    // Calculate optimal inversion if auto mode is enabled
    let optimalInversion;
    if (useAutoInversion) {
      optimalInversion = findOptimalInversion(chord.notes);
      setActualAutoInversion(optimalInversion);
    }
    
    // Apply the current inversion to the chord notes
    const invertedNotes = invertChord(chord.notes, currentInversion, optimalInversion);
    
    // Set chord notes as highlighted immediately
    updateHighlightedNotes(new Set(invertedNotes));
    
    // Stop any currently playing notes
    stopAllNotes(0.05);
    
    // Schedule all notes in the chord with precise timing
    // Add small delay for stopping previous notes
    
    // Play all notes in the chord with indefinite sustain
    invertedNotes.forEach(note => {
      // Use playNote instead of scheduleNote to allow indefinite sustain
      // We add a small delay to ensure previous notes are stopped
      setTimeout(() => {
        playNote(note);
      }, 50); // 50ms delay matches the 0.05 delay used above
    });
    
  }, [isLoaded, stopAllNotes, playNote, updateHighlightedNotes, onChordSelect, clearAllScheduledEvents, invertChord, currentInversion, useAutoInversion, findOptimalInversion]);

  // Update the stopChord function
  const stopChord = useCallback(() => {
    // Clear any existing scheduled events
    clearAllScheduledEvents();
    
    if (selectedChord) {
      // Stop all notes with a smooth release
      stopAllNotes(0.1);
      
      setSelectedChord(null);
      
      // Notify parent component about chord deselection
      if (onChordSelect) {
        onChordSelect(null);
      }
      
      // Clear highlighted notes
      updateHighlightedNotes(new Set());
    }
  }, [selectedChord, stopAllNotes, updateHighlightedNotes, onChordSelect, clearAllScheduledEvents]);

  // Load scale data
  useEffect(() => {
    const loadScaleData = async () => {
      try {
        // Load scales from all three files
        const [modesResponse, culturalResponse, extraResponse] = await Promise.all([
          fetch('/data/modes.json'),
          fetch('/data/CulturalEtc.json'),
          fetch('/data/extraScales.json')
        ]);
        
        const modesData = await modesResponse.json();
        const culturalData = await culturalResponse.json();
        const extraData = await extraResponse.json();
        
        // Create a merged data structure
        const mergedData: ScaleData = {
          title: "31-EDO Scales",
          families: {}
        };
        
        // Process modes data (array format)
        if (Array.isArray(modesData) && modesData.length > 0) {
          // Create a "Modes" family
          mergedData.families["Modes"] = {
            name: "Modes",
            scales: modesData
          };
        }
        
        // Process cultural data (object with categories)
        if (culturalData) {
          // Each key in culturalData is a category
          Object.entries(culturalData).forEach(([category, scales]) => {
            if (Array.isArray(scales) && scales.length > 0) {
              const formattedCategory = formatName(category);
              mergedData.families[category] = {
                name: formattedCategory,
                scales: scales as Scale[]
              };
            }
          });
        }
        
        // Process extra scales data (object with categories)
        if (extraData) {
          // Each key in extraData is a category
          Object.entries(extraData).forEach(([category, scales]) => {
            if (Array.isArray(scales) && scales.length > 0) {
              const formattedCategory = formatName(category);
              mergedData.families[category] = {
                name: formattedCategory,
                scales: scales as Scale[]
              };
            }
          });
        }
        
        setScaleData(mergedData);
        
        // Get family names
        const familyNames = Object.keys(mergedData.families);
        setFamilies(familyNames);
        
        // Log scale counts for debugging
        console.log("Loaded scale families:", 
          Object.entries(mergedData.families).map(([key, family]) => 
            `${key}: ${family.scales.length} scales`
          )
        );
        
        // Set default selections
        if (familyNames.length > 0) {
          setSelectedFamily(familyNames[0]);
          const firstFamily = mergedData.families[familyNames[0]];
          if (firstFamily.scales.length > 0) {
            setSelectedScale(firstFamily.scales[0]);
          }
        }
      } catch (error) {
        console.error('Error loading scale data:', error);
      }
    };
    
    loadScaleData();
  }, []);

  // Generate chords for the selected scale
  useEffect(() => {
    if (!selectedScale) return;
    
    const generateChordsForScale = () => {
      // If the scale already has a chord system defined, use it
      if (selectedScale.chordSystem) {
        // Extract triads and seventh chords from the existing chord system
        const existingTriads: Chord[] = [];
        const existingSevenths: Chord[] = [];
        
        // Process chords by degree
        if (selectedScale.chordSystem.chordsByDegree) {
          Object.values(selectedScale.chordSystem.chordsByDegree).forEach(degreeGroup => {
            degreeGroup.forEach(group => {
              group.chords.forEach(chord => {
                if (chord.notes.length === 3) {
                  existingTriads.push(chord);
                } else if (chord.notes.length === 4) {
                  existingSevenths.push(chord);
                }
              });
            });
          });
        }
        
        // If we found existing chords, use them
        if (existingTriads.length > 0 || existingSevenths.length > 0) {
          return {
            triads: existingTriads.length > 0 ? existingTriads : generateTriads(),
            sevenths: existingSevenths.length > 0 ? existingSevenths : generateSeventhChords()
          };
        }
      }
      
      // Otherwise, generate chords algorithmically
      return {
        triads: generateTriads(),
        sevenths: generateSeventhChords()
      };
    };
    
    // Generate triads algorithmically
    const generateTriads = () => {
      const degrees = selectedScale.degrees;
      const triads: Chord[] = [];
      
      // Determine if the scale is major-like or minor-like based on the third degree
      // Default to major if we can't determine
      let isMajorLike = true;
      if (degrees.length > 2) {
        const thirdInterval = degrees[2] - degrees[0];
        isMajorLike = thirdInterval >= 9; // Major or neutral third
      }
      const romanNumerals = isMajorLike ? ROMAN_NUMERALS_MAJOR : ROMAN_NUMERALS;
      
      // Create extended scale degrees that include the next octave
      const extendedDegrees = [...degrees];
      
      // Special case: If the scale includes both C (0) and high C (31),
      // we need to ensure they're treated as the same pitch class in different octaves
      const hasHighC = degrees.includes(31);
      const hasLowC = degrees.includes(0);
      
      // Add notes from the next octave
      for (let i = 0; i < degrees.length; i++) {
        // Skip adding high C from the next octave if the scale already has both C and high C
        if (hasHighC && hasLowC && degrees[i] === 0) continue;
        
        extendedDegrees.push(degrees[i] + 31); // Add the same note one octave higher
      }
      
      // Add notes from the second octave for more options
      for (let i = 0; i < degrees.length; i++) {
        extendedDegrees.push(degrees[i] + 62); // Add the same note two octaves higher
      }
      
      // Generate triads for each scale degree
      for (let i = 0; i < degrees.length; i++) {
        // Skip the octave if it's the last note and equals 31
        if (i === degrees.length - 1 && degrees[i] === 31) continue;
        
        const root = degrees[i];
        
        // Find the best third - look for intervals between 7-11 steps
        // If not found, look for the closest note that could function as a third
        let third = extendedDegrees.find(note => 
          note > root && note - root >= 7 && note - root <= 11
        );
        
        // If no third found in ideal range, find the closest approximation
        if (!third) {
          const possibleThirds = extendedDegrees.filter(note => note > root);
          if (possibleThirds.length > 0) {
            // Find the note closest to an ideal third (9 steps)
            third = possibleThirds.reduce((best, current) => {
              const idealThird = root + 9;
              const currentDiff = Math.abs(current - idealThird);
              const bestDiff = Math.abs(best - idealThird);
              return currentDiff < bestDiff ? current : best;
            }, possibleThirds[0]);
          }
        }
        
        // Find the best fifth - look for intervals between 17-19 steps
        // If not found, look for the closest note that could function as a fifth
        let fifth = extendedDegrees.find(note => 
          note > root && note - root >= 17 && note - root <= 19
        );
        
        // If no fifth found in ideal range, find the closest approximation
        if (!fifth) {
          const possibleFifths = extendedDegrees.filter(note => note > (third || root));
          if (possibleFifths.length > 0) {
            // Find the note closest to an ideal fifth (18 steps)
            fifth = possibleFifths.reduce((best, current) => {
              const idealFifth = root + 18;
              const currentDiff = Math.abs(current - idealFifth);
              const bestDiff = Math.abs(best - idealFifth);
              return currentDiff < bestDiff ? current : best;
            }, possibleFifths[0]);
          }
        }
        
        // If we have at least a root and one other note, create a chord
        if (third || fifth) {
          const chordNotes = [root];
          if (third) chordNotes.push(third);
          if (fifth) chordNotes.push(fifth);
          
          // Calculate intervals
          const intervals = [];
          if (third) intervals.push(third - root);
          if (fifth) intervals.push(fifth - root);
          
          // Determine chord type
          const chordType = getChordType(intervals);
          
          // Use appropriate roman numeral index, with fallback
          const romanIndex = i < romanNumerals.length ? i : i % romanNumerals.length;
          
          triads.push({
            degree: i,
            degreeRoman: romanNumerals[romanIndex],
            type: chordType,
            function: getFunctionFromDegree(i % 7, isMajorLike),
            notes: chordNotes,
            intervals: intervals
          });
        }
      }
      
      return triads;
    };
    
    // Generate seventh chords algorithmically
    const generateSeventhChords = () => {
      const degrees = selectedScale.degrees;
      const sevenths: Chord[] = [];
      
      // Determine if the scale is major-like or minor-like based on the third degree
      // Default to major if we can't determine
      let isMajorLike = true;
      if (degrees.length > 2) {
        const thirdInterval = degrees[2] - degrees[0];
        isMajorLike = thirdInterval >= 9; // Major or neutral third
      }
      const romanNumerals = isMajorLike ? ROMAN_NUMERALS_MAJOR : ROMAN_NUMERALS;
      
      // Create extended scale degrees that include the next octave
      const extendedDegrees = [...degrees];
      
      // Special case: If the scale includes both C (0) and high C (31),
      // we need to ensure they're treated as the same pitch class in different octaves
      const hasHighC = degrees.includes(31);
      const hasLowC = degrees.includes(0);
      
      // Add notes from the next octave
      for (let i = 0; i < degrees.length; i++) {
        // Skip adding high C from the next octave if the scale already has both C and high C
        if (hasHighC && hasLowC && degrees[i] === 0) continue;
        
        extendedDegrees.push(degrees[i] + 31); // Add the same note one octave higher
      }
      
      // Add notes from the second octave for seventh chords
      for (let i = 0; i < degrees.length; i++) {
        extendedDegrees.push(degrees[i] + 62); // Add the same note two octaves higher
      }
      
      // Add notes from the third octave for more options
      for (let i = 0; i < degrees.length; i++) {
        extendedDegrees.push(degrees[i] + 93); // Add the same note three octaves higher
      }
      
      // Generate seventh chords for each scale degree
      for (let i = 0; i < degrees.length; i++) {
        // Skip the octave if it's the last note and equals 31
        if (i === degrees.length - 1 && degrees[i] === 31) continue;
        
        const root = degrees[i];
        
        // Find the best third - look for intervals between 7-11 steps
        let third = extendedDegrees.find(note => 
          note > root && note - root >= 7 && note - root <= 11
        );
        
        // If no third found in ideal range, find the closest approximation
        if (!third) {
          const possibleThirds = extendedDegrees.filter(note => note > root);
          if (possibleThirds.length > 0) {
            // Find the note closest to an ideal third (9 steps)
            third = possibleThirds.reduce((best, current) => {
              const idealThird = root + 9;
              const currentDiff = Math.abs(current - idealThird);
              const bestDiff = Math.abs(best - idealThird);
              return currentDiff < bestDiff ? current : best;
            }, possibleThirds[0]);
          }
        }
        
        // Find the best fifth - look for intervals between 17-19 steps
        let fifth = extendedDegrees.find(note => 
          note > root && note - root >= 17 && note - root <= 19
        );
        
        // If no fifth found in ideal range, find the closest approximation
        if (!fifth) {
          const possibleFifths = extendedDegrees.filter(note => note > (third || root));
          if (possibleFifths.length > 0) {
            // Find the note closest to an ideal fifth (18 steps)
            fifth = possibleFifths.reduce((best, current) => {
              const idealFifth = root + 18;
              const currentDiff = Math.abs(current - idealFifth);
              const bestDiff = Math.abs(best - idealFifth);
              return currentDiff < bestDiff ? current : best;
            }, possibleFifths[0]);
          }
        }
        
        // Find the best seventh - look for intervals between 25-28 steps
        let seventh = extendedDegrees.find(note => 
          note > root && note - root >= 25 && note - root <= 28
        );
        
        // If no seventh found in ideal range, find the closest approximation
        if (!seventh) {
          const possibleSevenths = extendedDegrees.filter(note => note > (fifth || third || root));
          if (possibleSevenths.length > 0) {
            // Find the note closest to an ideal seventh (26 steps)
            seventh = possibleSevenths.reduce((best, current) => {
              const idealSeventh = root + 26;
              const currentDiff = Math.abs(current - idealSeventh);
              const bestDiff = Math.abs(best - idealSeventh);
              return currentDiff < bestDiff ? current : best;
            }, possibleSevenths[0]);
          }
        }
        
        // If we have at least a root and two other notes, create a chord
        if ((third && fifth) || (third && seventh) || (fifth && seventh)) {
          const chordNotes = [root];
          if (third) chordNotes.push(third);
          if (fifth) chordNotes.push(fifth);
          if (seventh) chordNotes.push(seventh);
          
          // Calculate intervals
          const intervals = [];
          if (third) intervals.push(third - root);
          if (fifth) intervals.push(fifth - root);
          if (seventh) intervals.push(seventh - root);
          
          // Determine chord type
          const chordType = getChordType(intervals);
          
          // Use appropriate roman numeral index, with fallback
          const romanIndex = i < romanNumerals.length ? i : i % romanNumerals.length;
          
          sevenths.push({
            degree: i,
            degreeRoman: romanNumerals[romanIndex],
            type: chordType,
            function: getFunctionFromDegree(i % 7, isMajorLike),
            notes: chordNotes,
            intervals: intervals
          });
        }
      }
      
      return sevenths;
    };
    
    const chords = generateChordsForScale();
    setGeneratedChords(chords);
    
  }, [selectedScale]);

  // Filter and sort scales based on search criteria
  useEffect(() => {
    if (!scaleData || !selectedFamily) return;
    
    const scales = scaleData.families[selectedFamily].scales;
    
    // Apply filters
    let filtered = [...scales];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(scale => {
        // Search in name
        if (scale.name && scale.name.toLowerCase().includes(term)) return true;
        
        // Search in description
        if (scale.description && scale.description.toLowerCase().includes(term)) return true;
        
        // Search in categories
        if (scale.categories) {
          for (const [category, values] of Object.entries(scale.categories)) {
            if (category.toLowerCase().includes(term)) return true;
            if (values.some(value => value.toLowerCase().includes(term))) return true;
          }
        }
        
        return false;
      });
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(scale => {
        if (!scale.categories) return false;
        
        for (const [category, values] of Object.entries(scale.categories)) {
          if (category === selectedCategory) return true;
        }
        
        return false;
      });
    }
    
    // Filter by note count
    if (noteCount !== null) {
      filtered = filtered.filter(scale => scale.degrees.length === noteCount + 1); // +1 for octave
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? (a.name || '').localeCompare(b.name || '') 
          : (b.name || '').localeCompare(a.name || '');
      }
      
      if (sortBy === 'noteCount') {
        const countA = a.degrees.length;
        const countB = b.degrees.length;
        return sortDirection === 'asc' ? countA - countB : countB - countA;
      }
      
      if (sortBy === 'brightness') {
        // Calculate brightness based on interval content
        // Higher values of intervals = brighter scale
        const brightnessA = a.intervals.reduce((sum, interval) => sum + interval, 0);
        const brightnessB = b.intervals.reduce((sum, interval) => sum + interval, 0);
        return sortDirection === 'asc' ? brightnessA - brightnessB : brightnessB - brightnessA;
      }
      
      return 0;
    });
    
    setFilteredScales(filtered);
    
    // Update scale selection if needed
    if (filtered.length > 0 && (!selectedScale || !filtered.includes(selectedScale))) {
      setSelectedScale(filtered[0]);
      setScaleIndex(0);
    } else if (filtered.length === 0) {
      setSelectedScale(null);
    }
    
  }, [scaleData, selectedFamily, searchTerm, selectedCategory, noteCount, sortBy, sortDirection, selectedScale]);

  // Handle keyboard shortcuts for playing chords
  useEffect(() => {
    if (!generatedChords.triads.length || !generatedChords.sevenths.length) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Handle chord keys (1-7)
      const isChordKey = /^[1-7]$/.test(key);
      if (isChordKey && !activeKeys.has(key)) {
        const chordIndex = parseInt(key) - 1;
        
        // Use the toggle state to determine which chord type to play
        if (useSeventhChords) {
          if (chordIndex < generatedChords.sevenths.length) {
            playChord(generatedChords.sevenths[chordIndex]);
          }
        } else {
          if (chordIndex < generatedChords.triads.length) {
            playChord(generatedChords.triads[chordIndex]);
          }
        }
        
        // Add to active keys
        setActiveKeys(prev => new Set(prev).add(key));
      }
      
      // Handle inversion keys (8, 9, 0, -, =)
      if (key === '8') {
        setInversion(0, false); // Root position
        // If a chord is currently selected, replay it with the new inversion
        if (selectedChord) {
          playChord(selectedChord);
        }
      } else if (key === '9') {
        setInversion(1, false); // First inversion
        if (selectedChord) {
          playChord(selectedChord);
        }
      } else if (key === '0') {
        setInversion(2, false); // Second inversion
        if (selectedChord) {
          playChord(selectedChord);
        }
      } else if (key === '-') {
        setInversion(3, false); // Third inversion (for seventh chords)
        if (selectedChord) {
          playChord(selectedChord);
        }
      } else if (key === '=') {
        setInversion(0, true); // Auto inversion
        if (selectedChord) {
          playChord(selectedChord);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const isChordKey = /^[1-7]$/.test(key);
      
      if (isChordKey && activeKeys.has(key)) {
        stopChord();
        
        // Remove from active keys
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedChords, activeKeys, playChord, stopChord, useSeventhChords, selectedChord]);

  // Function to set the inversion - wrapped in useCallback to avoid dependency issues
  const setInversion = useCallback((inversion: number, auto: boolean = false) => {
    setCurrentInversion(inversion);
    setUseAutoInversion(auto);
    
    // If a chord is currently selected, replay it with the new inversion
    if (selectedChord) {
      playChord(selectedChord);
    }
  }, [selectedChord, playChord, setCurrentInversion, setUseAutoInversion]);

  // Handle family change
  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const family = e.target.value;
    setSelectedFamily(family);
    setScaleIndex(0);
    if (scaleData && scaleData.families[family].scales.length > 0) {
      setSelectedScale(scaleData.families[family].scales[0]);
    } else {
      setSelectedScale(null);
    }
  };

  // Navigate to previous scale
  const handlePrevScale = () => {
    if (filteredScales.length === 0) return;
    
    const newIndex = (scaleIndex - 1 + filteredScales.length) % filteredScales.length;
    setScaleIndex(newIndex);
    setSelectedScale(filteredScales[newIndex]);
  };

  // Navigate to next scale
  const handleNextScale = () => {
    if (filteredScales.length === 0) return;
    
    const newIndex = (scaleIndex + 1) % filteredScales.length;
    setScaleIndex(newIndex);
    setSelectedScale(filteredScales[newIndex]);
  };

  // Update the playScale function to use Tone.js scheduling completely
  const playScale = useCallback(() => {
    if (!selectedScale || !isLoaded) return;
    
    // Clear any existing scheduled events
    clearAllScheduledEvents();
    
    // Stop any currently playing notes
    stopAllNotes(0.05);
    
    setIsPlaying(true);
    
    // Set up Tone.js timing variables
    const noteDuration = 0.4; // 300ms note duration
    const noteSpacing = 0.3; // 500ms between note starts
    const now = Tone.now();
    
    // Play each note in sequence using Tone.js scheduling
    const notes = [...selectedScale.degrees];
    
    // Set all scale notes as highlighted for visual feedback
    updateHighlightedNotes(new Set(notes));
    
    // Schedule each note with precise timing
    notes.forEach((note, index) => {
      // Schedule the note to play at the appropriate time
      const startTime = now + (index * noteSpacing);
      scheduleNote(note, startTime, noteDuration);
      
      // If this is the last note, schedule cleanup after it finishes
      if (index === notes.length - 1) {
        // Calculate when the sequence will end
        const endTime = startTime + noteDuration + 0.1; // Add a small buffer
        
        // Schedule the cleanup using Tone.js instead of setTimeout
        const eventId = Tone.Transport.schedule(() => {
          setIsPlaying(false);
          // Clear highlighted notes when done playing
          updateHighlightedNotes(new Set());
        }, endTime);
        
        scheduledEventsRef.current.push(eventId);
      }
    });
  }, [selectedScale, isLoaded, stopAllNotes, scheduleNote, updateHighlightedNotes, clearAllScheduledEvents]);

  // Memoize the scale data to pass to parent to prevent unnecessary re-renders
  const scaleForParent = useMemo(() => {
    return selectedScale ? {
      name: selectedScale.name,
      degrees: selectedScale.degrees
    } : null;
  }, [selectedScale]);
  
  // Update the selected scale and notify parent component
  useEffect(() => {
    if (onScaleSelect) {
      onScaleSelect(scaleForParent);
    }
  }, [scaleForParent, onScaleSelect]);

  // Cleanup on unmount or when dependencies change
  useEffect(() => {
    return () => {
      // Clear any scheduled events
      clearAllScheduledEvents();
      
      // Start Tone.js Transport if it's not running
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start();
      }
      
      // Stop any playing notes with a smooth release
      stopAllNotes(0.1);
      
      // Clear highlighted notes
      if (onHighlightNotes) {
        onHighlightNotes(new Set());
      }
    };
  }, [clearAllScheduledEvents, stopAllNotes, onHighlightNotes]);

  // Collect all available categories from scales
  useEffect(() => {
    if (!scaleData) return;
    
    const categories = new Set<string>();
    
    // Go through all scales in all families
    Object.values(scaleData.families).forEach(family => {
      family.scales.forEach(scale => {
        if (scale.categories) {
          Object.keys(scale.categories).forEach(category => {
            categories.add(category);
          });
        }
      });
    });
    
    setAvailableCategories(Array.from(categories).sort());
  }, [scaleData]);

  if (!scaleData || !selectedScale) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg animate-pulse">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">Loading scale data...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('basic')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'basic'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => setViewMode('advanced')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'advanced'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className={`mb-6 ${viewMode === 'basic' ? 'hidden' : ''}`}>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Search & Filter</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Scales
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by name, description, or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                id="category"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {formatName(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Note Count Filter */}
            <div>
              <label htmlFor="noteCount" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Notes
              </label>
              <select
                id="noteCount"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={noteCount === null ? 'all' : noteCount.toString()}
                onChange={(e) => setNoteCount(e.target.value === 'all' ? null : parseInt(e.target.value))}
              >
                <option value="all">Any</option>
                {[5, 6, 7, 8, 9, 10, 11, 12].map(count => (
                  <option key={count} value={count}>
                    {count} notes
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort By */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'noteCount' | 'brightness')}
              >
                <option value="name">Name</option>
                <option value="noteCount">Number of Notes</option>
                <option value="brightness">Brightness</option>
              </select>
            </div>
            
            {/* Sort Direction */}
            <div>
              <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Direction
              </label>
              <select
                id="sortDirection"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Found {filteredScales.length} scales matching your criteria
          </div>
        </div>
      </div>
      
      {/* Scale Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label htmlFor="family-select" className="block text-sm font-medium text-gray-700">
            Scale Family
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevScale}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              disabled={isPlaying}
              title="Previous Scale"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleNextScale}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              disabled={isPlaying}
              title="Next Scale"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-1/3">
            <select
              id="family-select"
              className="w-full p-2 border text-gray-800 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedFamily}
              onChange={handleFamilyChange}
            >
              {families.map(family => {
                // Determine the source of the family
                let source = "";
                if (family === "Modes") {
                  source = "Modes";
                } else if (["cultural", "nonSequentialHeptatonic", "variableCardinality"].includes(family)) {
                  source = "Cultural";
                } else if (["historical", "hybrid", "mos", "transformed", "wellFormed", "xenharmonic"].includes(family)) {
                  source = "Extra";
                }
                
                return (
                  <option key={family} value={family}>
                    {scaleData.families[family].name} {source ? `(${source})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="w-full md:w-2/3 flex flex-col">
            <h2 className="text-xl font-bold text-indigo-700 mb-2">{selectedScale.name}</h2>
            <div className="flex items-center">
              <button
                onClick={playScale}
                disabled={isPlaying || !isLoaded}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isPlaying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Playing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play Scale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scale Information */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Scale Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Degrees</h4>
              <div className="flex flex-wrap gap-1">
                {selectedScale.degrees.map((degree, index) => (
                  <span 
                    key={`degree-${index}`} 
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium
                      ${highlightedNotes.has(degree) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {degree}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Intervals</h4>
              <div className="flex flex-wrap gap-1">
                {selectedScale.intervals.map((interval, index) => (
                  <span 
                    key={`interval-${index}`} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {interval}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Description - shown only if available */}
          {selectedScale.description && (
            <div className="mt-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedScale.description}</p>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Categories</h4>
            <div className="bg-white p-3 rounded-md shadow-sm">
              {Object.entries(selectedScale.categories || {}).map(([category, values]) => (
                <div key={category} className="mb-2 last:mb-0">
                  <span className="text-sm font-medium text-indigo-600">{formatName(category)}:</span>{' '}
                  <span className="text-sm text-gray-700">{values.join(', ')}</span>
                </div>
              ))}
              {(!selectedScale.categories || Object.keys(selectedScale.categories).length === 0) && (
                <p className="text-sm text-gray-500 italic">No categories available</p>
              )}
            </div>
          </div>
          
          {/* Advanced information - only shown in advanced mode */}
          {viewMode === 'advanced' && (
            <>
              {/* Additional properties if available */}
              {selectedScale.properties && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Properties</h4>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    {Object.entries(selectedScale.properties).map(([key, value]) => (
                      <div key={key} className="mb-2 last:mb-0">
                        <span className="text-sm font-medium text-indigo-600">{formatName(key)}:</span>{' '}
                        <span className="text-sm text-gray-700">{value.toString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Modifications if available */}
              {selectedScale.modifications && selectedScale.modifications.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Modifications</h4>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex flex-wrap gap-1">
                      {selectedScale.modifications.map((mod, index) => (
                        <span 
                          key={`mod-${index}`} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Chord Section */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Scale Chords</h3>
            <div className="flex items-center bg-white rounded-md p-1 shadow-sm">
              <button
                onClick={() => setUseSeventhChords(false)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  !useSeventhChords ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Triads
              </button>
              <button
                onClick={() => setUseSeventhChords(true)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  useSeventhChords ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                7th Chords
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">Inversions:</div>
            <div className="flex items-center bg-white rounded-md p-1 shadow-sm">
              <button
                onClick={() => setInversion(0, false)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  currentInversion === 0 && !useAutoInversion ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Root Position (8)"
              >
                Root
              </button>
              <button
                onClick={() => setInversion(1, false)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  currentInversion === 1 && !useAutoInversion ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="First Inversion (9)"
              >
                1st
              </button>
              <button
                onClick={() => setInversion(2, false)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  currentInversion === 2 && !useAutoInversion ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Second Inversion (0)"
              >
                2nd
              </button>
              <button
                onClick={() => setInversion(3, false)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  currentInversion === 3 && !useAutoInversion ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Third Inversion (-)"
                disabled={!useSeventhChords}
              >
                3rd
              </button>
              <button
                onClick={() => setInversion(0, true)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  useAutoInversion ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Auto Inversion (lowest bass note)"
              >
                Auto
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Press keys <span className="font-bold mx-1">1-7</span> to play {useSeventhChords ? 'seventh chords' : 'triads'}. Hold down to sustain, release to stop.</span>
            </div>
            <div className="flex items-center ml-5">
              <span>Use keys <span className="font-bold mx-1">8, 9, 0, -</span> to select inversions (Root, 1st, 2nd, 3rd).</span>
            </div>
            <div className="flex items-center ml-5">
              <span>Press <span className="font-bold mx-1">a</span> for auto inversion (lowest bass note).</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(useSeventhChords ? generatedChords.sevenths : generatedChords.triads).map((chord, index) => (
              <button
                key={`chord-${index}`}
                className={`
                  p-2 rounded-md text-sm transition-all transform
                  ${selectedChord === chord 
                    ? 'bg-indigo-600 text-white shadow-md scale-105' 
                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm hover:shadow'}
                `}
                onMouseDown={() => playChord(chord)}
                onMouseUp={stopChord}
                onMouseLeave={stopChord}
                onTouchStart={() => playChord(chord)}
                onTouchEnd={stopChord}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{index + 1}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    selectedChord === chord ? 'bg-white bg-opacity-20 text-white' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {chord.type}
                  </span>
                </div>
                <div className="font-medium">
                  {chord.degreeRoman}{useSeventhChords ? <sup>7</sup> : ''}
                  {selectedChord === chord && (
                    useAutoInversion ? 
                      <span className="text-xs ml-1">
                        (Auto: {actualAutoInversion === 0 ? 'Root' : 
                               actualAutoInversion === 1 ? '1st' : 
                               actualAutoInversion === 2 ? '2nd' : '3rd'})
                      </span> :
                      currentInversion > 0 && 
                        <span className="text-xs ml-1">
                          ({currentInversion === 1 ? '1st' : currentInversion === 2 ? '2nd' : '3rd'})
                        </span>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {chord.intervals.map((interval, i) => 
                    <span key={i} className="mr-1">{interval}{i < chord.intervals.length - 1 ? "," : ""}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default ScaleBrowser; 