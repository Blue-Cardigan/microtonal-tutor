'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../utils/AudioContext';
import { getStepNoteName } from '../utils/IntervalUtils';

// Define keyboard mapping for the base octave
const BASE_KEYBOARD_MAPPING: { [key: string]: number } = {
  'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4, 'y': 5, 'u': 6, 'i': 7, 'o': 8, 'p': 9, '[': 10, ']': 11,
  'a': 12, 's': 13, 'd': 14, 'f': 15, 'g': 16, 'h': 17, 'j': 18, 'k': 19, 'l': 20, ';': 21, "'": 22, '\\': 23,
  'z': 24, 'x': 25, 'c': 26, 'v': 27, 'b': 28, 'n': 29, 'm': 30, ',': 31
};

// Define the traditional white keys in 31-EDO
// C=0, D=5, E=10, F=13, G=18, A=23, B=28, C=31
const WHITE_KEY_STEPS = [0, 5, 10, 13, 18, 23, 28, 31];

// Check if a step corresponds to a white key
const isWhiteKey = (step: number): boolean => {
  const stepInOctave = step % 31;
  return WHITE_KEY_STEPS.includes(stepInOctave);
};

interface KeyboardProps {
  highlightedNotes?: Set<number>;
  selectedScale?: {
    name: string;
    degrees: number[];
  } | null;
  showScale: boolean;
  highlightSource?: 'scale' | 'chord' | 'individual' | null;
  onHighlightNotes?: (notes: Set<number>, source: 'scale' | 'chord' | 'individual') => void;
}

const Keyboard = ({ 
  highlightedNotes, 
  selectedScale, 
  showScale, 
  highlightSource, 
  onHighlightNotes 
}: KeyboardProps) => {
  const { playNote, stopNote, activeNotes, isLoaded } = useAudio();
  const [keyboardActive, setKeyboardActive] = useState<{ [key: string]: boolean }>({});
  const [octaveShift, setOctaveShift] = useState<number>(0);
  const [localHighlightedNotes, setLocalHighlightedNotes] = useState<Set<number>>(new Set());

  // Helper for playing individual notes
  const playIndividualNote = useCallback((noteStep: number) => {
    playNote(noteStep);
    
    // Signal to parent that this is an individual note being played
    if (onHighlightNotes) {
      console.log('Keyboard: Signaling individual note play to parent');
      onHighlightNotes(new Set(), 'individual');
    }
    
    // Clear local highlighted notes
    setLocalHighlightedNotes(new Set());
  }, [playNote, onHighlightNotes]);

  // Sync our local highlighted notes with the prop and activeNotes
  useEffect(() => {
    // This is a key useEffect for managing highlights
    console.log(`Keyboard: Highlight source changed to: ${highlightSource}, highlightedNotes size: ${highlightedNotes?.size || 0}, activeNotes size: ${activeNotes.size}, showScale: ${showScale}`);
    
    // Make sure highlightedNotes is defined
    const notes = highlightedNotes || new Set<number>();
    
    // Case 1: Playing individual notes - we don't want to show scale highlights
    if (highlightSource === 'individual') {
      console.log('Keyboard: Playing individual notes - clearing all highlights');
      setLocalHighlightedNotes(new Set());
      return;
    }
    
    // Case 2: For scale-related highlights, respect the showScale toggle
    if (highlightSource === 'scale') {
      if (showScale) {
        if (notes.size > 0) {
          // Sequential highlights during scale playback or full scale display
          console.log('Keyboard: Setting highlights from scale with showScale true');
          setLocalHighlightedNotes(new Set(notes));
        } else if (selectedScale) {
          // No specific highlights but we have a scale and showScale is true
          console.log('Keyboard: Showing full scale with no specific highlights');
          setLocalHighlightedNotes(new Set(selectedScale.degrees));
        }
      } else {
        // showScale is false, don't show any scale highlights
        console.log('Keyboard: Scale highlights disabled by showScale toggle');
        setLocalHighlightedNotes(new Set());
      }
      return;
    }
    
    // Case 3: Chord selection - always show chord highlights regardless of showScale
    if (highlightSource === 'chord' && notes.size > 0) {
      console.log('Keyboard: Setting highlights from chord selection');
      setLocalHighlightedNotes(new Set(notes));
      return;
    }
    
    // Case 4: Actively playing notes but no external highlights
    if (activeNotes.size > 0 && notes.size === 0) {
      console.log('Keyboard: Playing notes but no external highlights - clearing highlights');
      setLocalHighlightedNotes(new Set());
      return;
    }
    
    // Case 5: Default case - clear highlights
    console.log('Keyboard: No specific case matched - clearing highlights');
    setLocalHighlightedNotes(new Set());
  }, [highlightSource, highlightedNotes, activeNotes, selectedScale, showScale]);

  // Generate all keys for the keyboard (single octave + top C)
  const generateKeys = useCallback(() => {
    const keys: number[] = [];
    // Include all notes in the octave (0-30) plus the top C (31)
    for (let step = 0; step <= 31; step++) {
      keys.push(step + (octaveShift * 31));
    }
    return keys;
  }, [octaveShift]);

  const keys = generateKeys();

  // Create keyboard mapping with octave shift
  const getKeyboardMapping = useCallback(() => {
    const mapping: { [key: string]: number } = {};
    Object.entries(BASE_KEYBOARD_MAPPING).forEach(([key, step]) => {
      mapping[key] = step + (octaveShift * 31);
    });
    return mapping;
  }, [octaveShift]);

  const KEYBOARD_MAPPING = getKeyboardMapping();

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if only certain modifier keys are pressed without a normal key
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        // Handle octave shift with Shift key
        if (e.key === 'Shift') {
          setOctaveShift(1);
        }
        return;
      }

      // Skip if we're in a text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check if this is for regular note input
      const key = e.key.toLowerCase();
      if (KEYBOARD_MAPPING[key] !== undefined) {
        const noteStep = KEYBOARD_MAPPING[key];
        if (!keyboardActive[key]) {
          // Play the individual note using our helper
          playIndividualNote(noteStep);
          setKeyboardActive(prev => ({ ...prev, [key]: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle octave shift with Shift key
      if (e.key === 'Shift') {
        setOctaveShift(0);
        return;
      }

      const key = e.key.toLowerCase();
      if (KEYBOARD_MAPPING[key] !== undefined) {
        const noteStep = KEYBOARD_MAPPING[key];
        stopNote(noteStep);
        setKeyboardActive(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playIndividualNote, stopNote, keyboardActive, KEYBOARD_MAPPING]);

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg">Loading keyboard...</div>;
  }

  // Calculate key dimensions
  const keyWidth = 2.8; // in percentage
  const keyGap = 0.3; // in percentage
  
  return (
    <div className="w-full">
      <div className="relative h-48 w-full bg-gray-100 p-2 rounded-lg">
        {/* All keys in a single layout */}
        {keys.map((noteStep) => {
          const isWhite = isWhiteKey(noteStep);
          const isActive = activeNotes.has(noteStep);
          const isHighlighted = localHighlightedNotes.has(noteStep);
          const noteName = getStepNoteName(noteStep);
          
          // Check if this note is part of the selected scale
          const isScaleNote = selectedScale && showScale && 
            selectedScale.degrees.some(degree => (degree % 31) === (noteStep % 31));
          
          // Find the keyboard key for this note (for display)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const keyboardKey = Object.entries(KEYBOARD_MAPPING).find(([_, step]) => step === noteStep)?.[0];
          
          // Calculate position
          const stepInOctave = noteStep % 31;
          
          // Special handling for the top C (note 31)
          // If this is the top C (31, 62, etc.), position it at the end
          const isTopC = noteStep === 31 + (octaveShift * 31);
          const position = isTopC 
            ? 31 * (keyWidth + keyGap) // Position at the end
            : stepInOctave * (keyWidth + keyGap);
          
          // Determine background color class with more distinct highlighting for scale playback
          let bgColorClass = '';
          if (isWhite) {
            if (isHighlighted) {
              // More vibrant green for highlighted notes
              bgColorClass = 'bg-green-400 border-2 border-green-500';
            } else if (isActive) {
              bgColorClass = 'bg-blue-200';
            } else if (isScaleNote) {
              bgColorClass = 'bg-indigo-100';
            } else {
              bgColorClass = 'bg-white';
            }
          } else {
            if (isHighlighted) {
              // More vibrant green for highlighted notes
              bgColorClass = 'bg-green-500 border-2 border-green-400';
            } else if (isActive) {
              bgColorClass = 'bg-blue-700';
            } else if (isScaleNote) {
              bgColorClass = 'bg-indigo-500';
            } else {
              bgColorClass = 'bg-gray-800';
            }
          }
          
          return (
            <div
              key={noteStep}
              className={`
                absolute rounded-b-md
                ${bgColorClass}
                ${isWhite ? 'h-4/5 z-0' : 'h-3/5 z-10'}
                ${isWhite ? 'text-black' : 'text-white'}
                flex flex-col justify-end items-center pb-1 cursor-pointer select-none
                shadow-md hover:shadow-lg transition-all duration-75
              `}
              style={{ 
                left: `${position}%`,
                width: `${keyWidth}%`,
              }}
              onMouseDown={() => {
                // Use our helper for playing individual notes
                playIndividualNote(noteStep);
              }}
              onMouseUp={() => stopNote(noteStep)}
              onMouseLeave={() => activeNotes.has(noteStep) && stopNote(noteStep)}
              onTouchStart={(e) => {
                e.preventDefault();
                // Use our helper for playing individual notes
                playIndividualNote(noteStep);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopNote(noteStep);
              }}
            >
              <div className={`text-[8px] font-bold overflow-hidden ${isWhite ? 'mt-auto' : ''}`}>{noteName}</div>
              {keyboardKey && (
                <div className="text-[8px] opacity-70">{keyboardKey.toUpperCase()}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Keyboard; 