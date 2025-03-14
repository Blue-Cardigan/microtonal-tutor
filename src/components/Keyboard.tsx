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
}

const Keyboard = ({ highlightedNotes }: KeyboardProps) => {
  const { playNote, stopNote, activeNotes, isLoaded } = useAudio();
  const [keyboardActive, setKeyboardActive] = useState<{ [key: string]: boolean }>({});
  const [octaveShift, setOctaveShift] = useState<number>(0);

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
      // Handle octave shift with Shift key
      if (e.key === 'Shift') {
        setOctaveShift(1);
        return;
      }

      const key = e.key.toLowerCase();
      if (KEYBOARD_MAPPING[key] !== undefined && !keyboardActive[key]) {
        const noteStep = KEYBOARD_MAPPING[key];
        playNote(noteStep);
        setKeyboardActive(prev => ({ ...prev, [key]: true }));
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
  }, [playNote, stopNote, keyboardActive, KEYBOARD_MAPPING]);

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
          const isHighlighted = highlightedNotes?.has(noteStep);
          const noteName = getStepNoteName(noteStep);
          
          // Find the keyboard key for this note (for display)
          const keyboardKey = Object.entries(KEYBOARD_MAPPING).find(([_, step]) => step === noteStep)?.[0];
          
          // Calculate position
          const stepInOctave = noteStep % 31;
          
          // Special handling for the top C (note 31)
          // If this is the top C (31, 62, etc.), position it at the end
          const isTopC = noteStep === 31 + (octaveShift * 31);
          const position = isTopC 
            ? 31 * (keyWidth + keyGap) // Position at the end
            : stepInOctave * (keyWidth + keyGap);
          
          return (
            <div
              key={noteStep}
              className={`
                absolute rounded-b-md
                ${isWhite 
                  ? (isActive ? 'bg-blue-200' : isHighlighted ? 'bg-green-100' : 'bg-white') 
                  : (isActive ? 'bg-blue-700' : isHighlighted ? 'bg-green-600' : 'bg-gray-800')}
                ${isWhite ? 'h-full z-0' : 'h-3/5 z-10'}
                ${isWhite ? 'text-black' : 'text-white'}
                flex flex-col justify-end items-center pb-1 cursor-pointer select-none
                shadow-md hover:shadow-lg transition-shadow
              `}
              style={{ 
                left: `${position}%`,
                width: `${keyWidth}%`,
              }}
              onMouseDown={() => playNote(noteStep)}
              onMouseUp={() => stopNote(noteStep)}
              onMouseLeave={() => activeNotes.has(noteStep) && stopNote(noteStep)}
              onTouchStart={(e) => {
                e.preventDefault();
                playNote(noteStep);
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
      <div className="mt-2 text-center text-sm text-gray-600">
        Hold <span className="font-bold">Shift</span> key to play the higher octave
      </div>
    </div>
  );
};

export default Keyboard; 