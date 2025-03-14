'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Tone from 'tone';

interface AudioContextType {
  sampler: Tone.Sampler | null;
  isLoaded: boolean;
  playNote: (note: number) => void;
  stopNote: (note: number) => void;
  activeNotes: Set<number>;
}

const AudioContext = createContext<AudioContextType>({
  sampler: null,
  isLoaded: false,
  playNote: () => {},
  stopNote: () => {},
  activeNotes: new Set(),
});

export const useAudio = () => useContext(AudioContext);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider = ({ children }: AudioProviderProps) => {
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  // Track the currently playing notes with their frequencies
  const [playingNotes, setPlayingNotes] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    // Create a sampler with the rhodes220.mp3 sample
    const newSampler = new Tone.Sampler({
      urls: {
        A4: "rhodes220.mp3",
      },
      baseUrl: "/data/",
      onload: () => {
        setIsLoaded(true);
        console.log("Sampler loaded");
      },
      // Add envelope settings for better note transitions
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.5, // Longer release time for smoother transitions
      }
    }).toDestination();

    setSampler(newSampler);

    return () => {
      newSampler.dispose();
    };
  }, []);

  // Function to convert 31-EDO step to frequency
  const stepToFrequency = (step: number): number => {
    // A4 = 440Hz at step 0
    // Each step in 31-EDO is 1200/31 = 38.71 cents
    const centsPerStep = 1200 / 31;
    const cents = step * centsPerStep;
    return 440 * Math.pow(2, cents / 1200);
  };

  const playNote = (note: number) => {
    if (sampler && isLoaded) {
      const freq = stepToFrequency(note);
      
      // Store the frequency for this note
      setPlayingNotes(prev => {
        const newMap = new Map(prev);
        newMap.set(note, freq);
        return newMap;
      });
      
      // Use triggerAttack with the frequency
      sampler.triggerAttack(freq);
      
      setActiveNotes((prev) => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
    }
  };

  const stopNote = (note: number) => {
    if (sampler && isLoaded) {
      // Get the frequency for this note from our map
      const freq = playingNotes.get(note);
      
      if (freq) {
        // Use triggerRelease with a release time for a smoother transition
        sampler.triggerRelease(freq, Tone.now() + 0.1); // Add a small delay before release
        
        // Remove the note from our tracking map
        setPlayingNotes(prev => {
          const newMap = new Map(prev);
          newMap.delete(note);
          return newMap;
        });
        
        setActiveNotes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(note);
          return newSet;
        });
      }
    }
  };

  return (
    <AudioContext.Provider value={{ sampler, isLoaded, playNote, stopNote, activeNotes }}>
      {children}
    </AudioContext.Provider>
  );
}; 