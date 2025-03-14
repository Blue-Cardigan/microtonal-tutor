'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../utils/AudioContext';
import { formatName } from '../utils/IntervalUtils';

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
}

// Define Roman numeral mapping
const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
const ROMAN_NUMERALS_MAJOR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Define 31-EDO interval classifications
const getIntervalType = (interval: number): string => {
  // In 31-EDO:
  // Perfect fifth = 18 steps
  // Major third = 10 steps
  // Minor third = 8 steps
  // Neutral third = 9 steps
  // Diminished fifth = 17 steps
  // Augmented fifth = 19 steps
  // Major seventh = 28 steps
  // Minor seventh = 26 steps
  // Dominant seventh = 27 steps
  
  switch(interval) {
    case 8: return "minor";
    case 9: return "neutral";
    case 10: return "major";
    case 17: return "diminished";
    case 18: return "perfect";
    case 19: return "augmented";
    case 26: return "minor";
    case 27: return "dominant";
    case 28: return "major";
    default: return "unknown";
  }
};

// Function to convert 31-EDO note number to a readable note name
const getNoteNameFrom31EDO = (note: number): string => {
  // In 31-EDO, each octave has 31 steps
  // C = 0, C# = 1, D♭ = 2, D = 5, etc.
  const noteNames = [
    "C", "C♯", "D♭", "C♯♯", "D", "D♯", "E♭", "D♯♯", "E", "E♯", "F", 
    "F♯", "G♭", "F♯♯", "G", "G♯", "A♭", "G♯♯", "A", "A♯", "B♭", 
    "A♯♯", "B", "B♯", "C♭", "B♯♯", "C", "C♯", "D♭", "C♯♯", "D"
  ];
  
  // Get the octave number (assuming C4 = 0)
  const octave = Math.floor(note / 31) + 4;
  
  // Get the note within the octave
  const noteIndex = ((note % 31) + 31) % 31;
  
  return `${noteNames[noteIndex]}${octave}`;
};

// Function to determine chord type based on intervals in 31-EDO
const getChordType = (intervals: number[]): string => {
  if (intervals.length < 2) return "unknown";
  
  // For triads
  if (intervals.length === 2) {
    const third = intervals[0];
    const fifth = intervals[1];
    
    if (third === 10 && fifth === 18) return "major";
    if (third === 8 && fifth === 18) return "minor";
    if (third === 9 && fifth === 18) return "neutral";
    if (third === 10 && fifth === 19) return "augmented";
    if (third === 8 && fifth === 17) return "diminished";
    if (third === 10 && fifth === 17) return "major♭5";
    if (third === 8 && fifth === 19) return "minor♯5";
    
    return `${getIntervalType(third)}-${getIntervalType(fifth)}`;
  }
  
  // For seventh chords
  if (intervals.length === 3) {
    const third = intervals[0];
    const fifth = intervals[1];
    const seventh = intervals[2];
    
    let triadType = "";
    
    if (third === 10 && fifth === 18) triadType = "major";
    else if (third === 8 && fifth === 18) triadType = "minor";
    else if (third === 9 && fifth === 18) triadType = "neutral";
    else if (third === 10 && fifth === 19) triadType = "augmented";
    else if (third === 8 && fifth === 17) triadType = "diminished";
    else triadType = `${getIntervalType(third)}-${getIntervalType(fifth)}`;
    
    const seventhType = getIntervalType(seventh);
    
    // Special cases for common seventh chord types
    if (triadType === "major" && seventhType === "dominant") return "dominant 7";
    if (triadType === "major" && seventhType === "major") return "major 7";
    if (triadType === "minor" && seventhType === "minor") return "minor 7";
    if (triadType === "diminished" && seventhType === "minor") return "half-diminished 7";
    if (triadType === "diminished" && seventh === 25) return "diminished 7";
    if (triadType === "neutral" && seventhType === "minor") return "neutral minor 7";
    if (triadType === "neutral" && seventhType === "dominant") return "neutral dominant 7";
    
    return `${triadType} ${seventhType} 7`;
  }
  
  return "unknown";
};

const ScaleBrowser = ({ onHighlightNotes }: ScaleBrowserProps) => {
  const { playNote, stopNote, isLoaded } = useAudio();
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

  // Define playChord and stopChord functions first (before they're used in useEffect)
  const playChord = useCallback((chord: Chord) => {
    if (!isLoaded) return;
    
    // Set the new selected chord immediately for UI updates
    setSelectedChord(chord);
    
    // Set chord notes as highlighted immediately
    setHighlightedNotes(new Set(chord.notes));
    if (onHighlightNotes) {
      onHighlightNotes(new Set(chord.notes));
    }
    
    // If there's a currently playing chord, stop its notes first
    if (selectedChord) {
      // Stop previous chord notes
      selectedChord.notes.forEach(note => stopNote(note));
      
      // Add a small delay before playing the new chord to allow for proper release
      setTimeout(() => {
        // Play all notes in the new chord
        chord.notes.forEach(note => playNote(note));
      }, 50); // 50ms delay for smooth transition
    } else {
      // No previous chord, play immediately
      chord.notes.forEach(note => playNote(note));
    }
  }, [isLoaded, selectedChord, playNote, stopNote, onHighlightNotes]);

  // Update the stopChord function
  const stopChord = useCallback(() => {
    if (selectedChord) {
      selectedChord.notes.forEach(note => stopNote(note));
      setSelectedChord(null);
      // Clear highlighted notes
      setHighlightedNotes(new Set());
      if (onHighlightNotes) {
        onHighlightNotes(new Set());
      }
    }
  }, [selectedChord, stopNote, onHighlightNotes]);

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
      
      // Add notes from the next octave
      for (let i = 0; i < degrees.length; i++) {
        extendedDegrees.push(degrees[i] + 31); // Add the same note one octave higher
      }
      
      // Function to voice a chord within a single octave
      const voiceChordInOctave = (notes: number[]): number[] => {
        if (notes.length <= 1) return notes;
        
        const root = notes[0];
        const voiced: number[] = [root];
        
        // Voice remaining notes to be as close as possible to the previous note
        // while staying within a single octave of the root
        for (let i = 1; i < notes.length; i++) {
          let note = notes[i];
          
          // If the note is more than an octave above the root, bring it down
          while (note - root >= 31) {
            note -= 31;
          }
          
          // If the note is below the root, bring it up
          while (note < root) {
            note += 31;
          }
          
          // Now check if this creates a better voicing by comparing with the previous note
          const prevNote = voiced[i-1];
          
          // If the note is more than a perfect fifth above the previous note,
          // try bringing it down an octave to see if that creates a closer voicing
          if (note - prevNote > 18 && note - 31 >= root) {
            const altNote = note - 31;
            // Use the alternative if it's closer to the previous note
            if (prevNote - altNote < note - prevNote) {
              note = altNote;
            }
          }
          
          voiced.push(note);
        }
        
        return voiced;
      };
      
      // Generate triads and seventh chords for each scale degree
      for (let i = 0; i < degrees.length; i++) {
        const root = degrees[i];
        
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
      // Check if the key is a number between 1-7
      const key = e.key;
      const isNumber = /^[1-7]$/.test(key);
      
      if (isNumber && !activeKeys.has(key)) {
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
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const isNumber = /^[1-7]$/.test(key);
      
      if (isNumber && activeKeys.has(key)) {
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
  }, [generatedChords, activeKeys, playChord, stopChord, useSeventhChords]);

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
    if (!scaleData || !selectedFamily) return;
    
    const scales = scaleData.families[selectedFamily].scales;
    const newIndex = (scaleIndex + 1) % scales.length;
    setScaleIndex(newIndex);
    setSelectedScale(scales[newIndex]);
  };

  // Toggle between triads and seventh chords
  const toggleChordType = () => {
    setUseSeventhChords(prev => !prev);
  };

  // Update the setHighlightedNotes calls to also call onHighlightNotes
  useEffect(() => {
    // When component unmounts, clear any highlighted notes
    return () => {
      if (onHighlightNotes) {
        onHighlightNotes(new Set());
      }
    };
  }, [onHighlightNotes]);

  // Update the playScale function
  const playScale = () => {
    if (!selectedScale || !isLoaded) return;
    
    setIsPlaying(true);
    
    // Play each note in sequence
    const notes = [...selectedScale.degrees];
    let index = 0;
    
    // Set all scale notes as highlighted
    setHighlightedNotes(new Set(notes));
    if (onHighlightNotes) {
      onHighlightNotes(new Set(notes));
    }
    
    const playNextNote = () => {
      if (index < notes.length) {
        const note = notes[index];
        
        // If not the first note, stop the previous note with a small delay before playing the next
        if (index > 0) {
          const prevNote = notes[index - 1];
          stopNote(prevNote);
          
          // Add a small delay before playing the next note
          setTimeout(() => {
            playNote(note);
            index++;
            setTimeout(playNextNote, 450); // Reduced from 500ms to account for the 50ms delay
          }, 50);
        } else {
          // First note, play immediately
          playNote(note);
          index++;
          setTimeout(playNextNote, 500);
        }
      } else {
        // Add a small delay before stopping the last note for a smoother ending
        setTimeout(() => {
          // Stop the last note
          stopNote(notes[notes.length - 1]);
          setIsPlaying(false);
          // Clear highlighted notes when done playing
          setHighlightedNotes(new Set());
          if (onHighlightNotes) {
            onHighlightNotes(new Set());
          }
        }, 50);
      }
    };
    
    playNextNote();
  };

  if (!scaleData || !selectedScale) {
    return <div className="p-4 bg-gray-100 rounded-lg">Loading scale data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="mb-4">
        <label htmlFor="family-select" className="block text-sm font-medium text-gray-700 mb-1">
          Scale Family
        </label>
        <select
          id="family-select"
          className="w-full p-2 border border-gray-300 rounded-md"
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
      
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevScale}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={isPlaying}
        >
          Previous
        </button>
        
        <h2 className="text-xl font-bold">{selectedScale.name}</h2>
        
        <button
          onClick={handleNextScale}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={isPlaying}
        >
          Next
        </button>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Scale Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-medium">Degrees:</span> {selectedScale.degrees.join(', ')}
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-medium">Intervals:</span> {selectedScale.intervals.join(', ')}
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="font-medium">Categories:</h4>
          {Object.entries(selectedScale.categories).map(([category, values]) => (
            <div key={category} className="mt-1">
              <span className="text-sm font-medium">{formatName(category)}:</span>{' '}
              <span className="text-sm">{values.join(', ')}</span>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={playScale}
        disabled={isPlaying || !isLoaded}
        className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 mb-4"
      >
        {isPlaying ? 'Playing...' : 'Play Scale'}
      </button>
      
      {/* Generated Chords Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Scale Chords</h3>
          <div className="flex items-center">
            <span className="text-sm mr-2">Triads</span>
            <div 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${useSeventhChords ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={toggleChordType}
              role="switch"
              aria-checked={useSeventhChords}
              tabIndex={0}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSeventhChords ? 'translate-x-6' : 'translate-x-1'}`} 
              />
            </div>
            <span className="text-sm ml-2">7th Chords</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">
          Press keys <span className="font-bold">1-7</span> to play {useSeventhChords ? 'seventh chords' : 'triads'}
        </p>
        
        {/* Display either triads or seventh chords based on toggle */}
        <div className="flex flex-wrap gap-1">
          {(useSeventhChords ? generatedChords.sevenths : generatedChords.triads).map((chord, index) => (
            <button
              key={`chord-${index}`}
              className={`px-2 py-1 text-xs rounded ${
                selectedChord === chord ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onMouseDown={() => playChord(chord)}
              onMouseUp={stopChord}
              onMouseLeave={stopChord}
            >
              <span className="font-bold mr-1">{index + 1}:</span> 
              {chord.degreeRoman}{useSeventhChords ? <sup>7</sup> : ''} ({chord.type})
            </button>
          ))}
        </div>
        
        {/* Display currently selected chord notes */}
        {selectedChord && (
          <div className="mt-3 p-2 bg-blue-50 rounded-md">
            <h4 className="text-sm font-semibold mb-1">Chord Notes:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedChord.notes.map((note, index) => (
                <div key={`note-${index}`} className="px-2 py-1 bg-blue-100 rounded text-xs">
                  {getNoteNameFrom31EDO(note)} ({note}) {index === 0 ? '(root)' : index === 1 ? '(3rd)' : index === 2 ? '(5th)' : '(7th)'}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Intervals from root: {selectedChord.intervals.join(', ')}
            </p>
          </div>
        )}
      </div>
      
      
    </div>
  );
};

export default ScaleBrowser; 