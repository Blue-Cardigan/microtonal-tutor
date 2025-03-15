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

// Enhanced function to determine chord type based on intervals in 31-EDO
const getChordType = (intervals: number[]): string => {
  if (intervals.length < 2) return "unknown";
  
  // For triads
  if (intervals.length === 2) {
    const third = intervals[0];
    const fifth = intervals[1];
    
    // Standard triads with perfect fifth (18 steps)
    if (fifth === 18) {
      if (third === 7) return "subminor"; // Subminor third (7 steps)
      if (third === 8) return "minor";    // Minor third (8 steps)
      if (third === 9) return "neutral";  // Neutral third (9 steps)
      if (third === 10) return "major";   // Major third (10 steps)
      if (third === 11) return "supermajor"; // Supermajor third (11 steps)
    }
    
    // Augmented triads (fifth = 19 steps)
    if (fifth === 19) {
      if (third === 8) return "minor augmented"; // Minor third with augmented fifth
      if (third === 9) return "neutral augmented"; // Neutral third with augmented fifth
      if (third === 10) return "augmented";     // Major third with augmented fifth
      if (third === 11) return "supermajor augmented"; // Supermajor third with augmented fifth
    }
    
    // Diminished triads (fifth = 17 steps)
    if (fifth === 17) {
      if (third === 7) return "subminor diminished"; // Subminor third with diminished fifth
      if (third === 8) return "diminished";  // Minor third with diminished fifth
      if (third === 9) return "neutral diminished"; // Neutral third with diminished fifth
      if (third === 10) return "major diminished"; // Major third with diminished fifth
    }
    
    // Special cases for other fifths
    if (fifth === 16 && third === 8) return "double diminished"; // Minor third with double diminished fifth
    if (fifth === 20 && third === 10) return "double augmented"; // Major third with double augmented fifth
    
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
    
    if (third === 7 && fifth === 18) triadType = "subminor";
    else if (third === 8 && fifth === 18) triadType = "minor";
    else if (third === 9 && fifth === 18) triadType = "neutral";
    else if (third === 10 && fifth === 18) triadType = "major";
    else if (third === 11 && fifth === 18) triadType = "supermajor";
    else if (third === 8 && fifth === 17) triadType = "diminished";
    else if (third === 10 && fifth === 19) triadType = "augmented";
    else triadType = `${getIntervalType(third)}-${getIntervalType(fifth)}`;
    
    // Special named seventh chords
    
    // Harmonic seventh chord (4:5:6:7)
    if (third === 10 && fifth === 18 && seventh === 25) return "harmonic 7";
    
    // Undecimal tetrad (6:7:9:11)
    if (third === 7 && fifth === 18 && seventh === 27) return "undecimal tetrad";
    
    // Utonal tetrad (12/10/8/7)
    if (third === 8 && fifth === 18 && seventh === 20) return "utonal tetrad";
    
    // 9-over tetrad (9/7/6/5)
    if (third === 11 && fifth === 18 && seventh === 26) return "9-over tetrad";
    
    // Standard seventh chord types
    if (triadType === "major" && seventh === 28) return "major 7";
    if (triadType === "major" && seventh === 27) return "dominant 7";
    if (triadType === "minor" && seventh === 26) return "minor 7";
    if (triadType === "diminished" && seventh === 26) return "half-diminished 7";
    if (triadType === "diminished" && seventh === 25) return "diminished 7";
    if (triadType === "neutral" && seventh === 27) return "neutral dominant 7";
    if (triadType === "neutral" && seventh === 26) return "neutral minor 7";
    if (triadType === "subminor" && seventh === 25) return "subminor 7";
    if (triadType === "subminor" && seventh === 27) return "subminor neutral 7";
    if (triadType === "supermajor" && seventh === 28) return "supermajor 7";
    if (triadType === "supermajor" && seventh === 26) return "supermajor minor 7";
    
    // If no specific name, combine triad type with seventh type
    return `${triadType} ${getIntervalType(seventh)} 7`;
  }
  
  // For extended chords (9ths, 11ths, 13ths)
  if (intervals.length > 3) {
    // Identify special extended chords
    
    // Otonality (4:5:6:7:9:11)
    if (intervals.length >= 5 && 
        intervals[0] === 10 && intervals[1] === 18 && 
        intervals[2] === 25 && intervals[3] === 28) {
      return intervals.length === 5 ? "otonality (9)" : "otonality (11)";
    }
    
    // Extended harmonic series chord
    if (intervals.length >= 5 && 
        intervals[0] === 10 && intervals[1] === 18 && 
        intervals[2] === 25) {
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
    
    console.log(normalizedNotes);
    
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
        const response = await fetch('/data/results_with_chords.json');
        const data = await response.json();
        setScaleData(data);
        
        // Get family names
        const familyNames = Object.keys(data.families);
        setFamilies(familyNames);
        
        // Set default selections
        if (familyNames.length > 0) {
          setSelectedFamily(familyNames[0]);
          const firstFamily = data.families[familyNames[0]];
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
      const degrees = selectedScale.degrees;
      const triads: Chord[] = [];
      const sevenths: Chord[] = [];
      
      // Determine if the scale is major-like or minor-like based on the third degree
      const thirdInterval = degrees[2] - degrees[0];
      const isMajorLike = thirdInterval >= 9; // Major or neutral third
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
      
      // Function to voice a chord within a single octave
      const voiceChordInOctave = (notes: number[]): number[] => {
        if (notes.length <= 1) return notes;
        
        const root = notes[0];
        
        // Simply normalize all notes to be within an octave of the root
        // without attempting to create tighter voicings through inversions
        return notes.map(note => {
          let normalized = note;
          // If the note is above the root by more than an octave, bring it down
          while (normalized - root >= 31) {
            normalized -= 31;
          }
          // If the note is below the root, bring it up
          while (normalized < root) {
            normalized += 31;
          }
          return normalized;
        });
      };
      
      // Generate triads and seventh chords for each scale degree
      for (let i = 0; i < degrees.length; i++) {
        const root = degrees[i];
        
        // Skip generating chords for the high C if we already have chords for the low C
        // This prevents duplicate chords with the same pitch class
        if (hasHighC && hasLowC && root === 31) continue;
        
        // Build triad (1-3-5)
        // Use extended degrees to properly handle notes that wrap around the octave
        const rawTriadNotes = [
          root,
          extendedDegrees[i + 2], // Third
          extendedDegrees[i + 4]  // Fifth
        ];
        
        // Voice the triad within an octave
        const triadNotes = voiceChordInOctave(rawTriadNotes);
        
        // Calculate intervals from the root
        const triadIntervals = [
          triadNotes[1] - triadNotes[0],
          triadNotes[2] - triadNotes[0]
        ];
        
        // Ensure intervals are within an octave
        triadIntervals[0] = ((triadIntervals[0] % 31) + 31) % 31;
        triadIntervals[1] = ((triadIntervals[1] % 31) + 31) % 31;
        
        // Create triad chord
        const triadType = getChordType(triadIntervals);
        const triad: Chord = {
          degree: i + 1,
          degreeRoman: romanNumerals[i],
          type: triadType,
          function: "",
          notes: triadNotes,
          intervals: triadIntervals
        };
        
        triads.push(triad);
        
        // Build seventh chord (1-3-5-7)
        const rawSeventhNotes = [
          root,
          extendedDegrees[i + 2], // Third
          extendedDegrees[i + 4], // Fifth
          extendedDegrees[i + 6]  // Seventh
        ];
        
        // Voice the seventh chord within an octave
        const seventhNotes = voiceChordInOctave(rawSeventhNotes);
        
        // Calculate intervals from the root
        const seventhIntervals = [
          seventhNotes[1] - seventhNotes[0],
          seventhNotes[2] - seventhNotes[0],
          seventhNotes[3] - seventhNotes[0]
        ];
        
        // Ensure intervals are within an octave
        seventhIntervals[0] = ((seventhIntervals[0] % 31) + 31) % 31;
        seventhIntervals[1] = ((seventhIntervals[1] % 31) + 31) % 31;
        seventhIntervals[2] = ((seventhIntervals[2] % 31) + 31) % 31;
        
        // Create seventh chord
        const seventhType = getChordType(seventhIntervals);
        const seventh: Chord = {
          degree: i + 1,
          degreeRoman: romanNumerals[i],
          type: seventhType,
          function: "",
          notes: seventhNotes,
          intervals: seventhIntervals
        };
        
        sevenths.push(seventh);
      }
      
      return { triads, sevenths };
    };
    
    const chords = generateChordsForScale();
    setGeneratedChords(chords);
    
  }, [selectedScale]);

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
    if (!scaleData || !selectedFamily) return;
    
    const scales = scaleData.families[selectedFamily].scales;
    const newIndex = (scaleIndex - 1 + scales.length) % scales.length;
    setScaleIndex(newIndex);
    setSelectedScale(scales[newIndex]);
  };

  // Navigate to next scale
  const handleNextScale = () => {
    const scales = scaleData?.families[selectedFamily]?.scales || [];
    if (scales.length === 0) return;
    
    const newIndex = (scaleIndex + 1) % scales.length;
    setScaleIndex(newIndex);
    setSelectedScale(scales[newIndex]);
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
              {families.map(family => (
                <option key={family} value={family}>
                  {scaleData.families[family].name}
                </option>
              ))}
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
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Categories</h4>
            <div className="bg-white p-3 rounded-md shadow-sm">
              {Object.entries(selectedScale.categories).map(([category, values]) => (
                <div key={category} className="mb-2 last:mb-0">
                  <span className="text-sm font-medium text-indigo-600">{formatName(category)}:</span>{' '}
                  <span className="text-sm text-gray-700">{values.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
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