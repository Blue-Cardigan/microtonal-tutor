'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Tone from 'tone';

interface AudioContextType {
  sampler: Tone.Sampler | null;
  isLoaded: boolean;
  playNote: (note: number) => void;
  stopNote: (note: number, releaseTime?: number) => void;
  stopAllNotes: (releaseTime?: number) => void;
  scheduleNote: (note: number, time?: number, duration?: number) => void;
  activeNotes: Set<number>;
}

const AudioContext = createContext<AudioContextType>({
  sampler: null,
  isLoaded: false,
  playNote: () => {},
  stopNote: () => {},
  stopAllNotes: () => {},
  scheduleNote: () => {},
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

  // Initialize Tone.js
  useEffect(() => {
    const initializeTone = async () => {
      try {
        // Initialize Tone.js context
        await Tone.start();
        
        // Start the transport for scheduling
        if (Tone.Transport.state !== "started") {
          Tone.Transport.start();
        }
        
        console.log("Tone.js initialized and transport started");
      } catch (error) {
        console.error("Failed to initialize Tone.js:", error);
      }
    };
    
    initializeTone();
    
    return () => {
      // Clean up Transport events when component unmounts
      Tone.Transport.cancel();
    };
  }, []);

  // Create and configure the sampler
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
      release: 0.2, // Set release time for smoother transitions but shorter than before
      attack: 0.01,
      volume: -6, // Slightly lower volume to prevent clipping
    }).toDestination();

    setSampler(newSampler);

    return () => {
      // Ensure all notes are stopped before disposing
      newSampler.releaseAll();
      newSampler.dispose();
    };
  }, []);

  // Function to convert 31-EDO step to frequency
  const stepToFrequency = useCallback((step: number): number => {
    // In 31-EDO, C4 is at step 0
    // A4 is 9 steps above C4 in 31-EDO
    // A4 = 440Hz
    
    // Calculate the step relative to A4
    const stepsFromA4 = step - 9;
    
    // Each step in 31-EDO is 1200/31 = 38.71 cents
    const centsPerStep = 1200 / 31;
    const cents = stepsFromA4 * centsPerStep;
    
    // Calculate frequency using A4 (440Hz) as reference
    return 440 * Math.pow(2, cents / 1200);
  }, []);

  const playNote = useCallback((note: number) => {
    if (!sampler || !isLoaded) return;
    
    try {
      const freq = stepToFrequency(note);
      
      // Store the frequency for this note
      setPlayingNotes(prev => {
        const newMap = new Map(prev);
        newMap.set(note, freq);
        return newMap;
      });
      
      // Use triggerAttack with the frequency
      sampler.triggerAttack(freq);
      
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
    } catch (error) {
      console.error("Error playing note:", error);
    }
  }, [sampler, isLoaded, stepToFrequency]);

  const stopNote = useCallback((note: number, releaseTime: number = 0.1) => {
    if (!sampler || !isLoaded) return;
    
    try {
      // Get the frequency for this note from our map
      const freq = playingNotes.get(note);
      
      if (freq) {
        // Use triggerRelease with a release time for a smoother transition
        sampler.triggerRelease(freq, Tone.now() + releaseTime);
        
        // Remove the note from our tracking map
        setPlayingNotes(prev => {
          const newMap = new Map(prev);
          newMap.delete(note);
          return newMap;
        });
        
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(note);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error stopping note:", error);
    }
  }, [sampler, isLoaded, playingNotes]);

  const stopAllNotes = useCallback((releaseTime: number = 0.1) => {
    if (!sampler || !isLoaded) return;
    
    try {
      // Release all notes with the specified release time
      sampler.releaseAll(Tone.now() + releaseTime);
      
      // Clear our tracking maps
      setPlayingNotes(new Map());
      setActiveNotes(new Set());
    } catch (error) {
      console.error("Error stopping all notes:", error);
    }
  }, [sampler, isLoaded]);

  // Enhanced method to schedule a note to play for a specific duration
  const scheduleNote = useCallback((note: number, time = Tone.now(), duration = 0.3) => {
    if (!sampler || !isLoaded) return;
    
    try {
      const freq = stepToFrequency(note);
      
      // Add to active notes immediately for visual feedback
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
      
      // Ensure we're using the most accurate timing method
      sampler.triggerAttackRelease(freq, duration, time);
      
      // Schedule removal from active notes using Tone.Transport for precise timing
      const eventId = Tone.Transport.schedule(() => {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(note);
          return newSet;
        });
      }, time + duration);
      
      // Return the event ID so the caller could cancel it if needed
      return eventId;
    } catch (error) {
      console.error("Error scheduling note:", error);
      return null;
    }
  }, [sampler, isLoaded, stepToFrequency]);

  return (
    <AudioContext.Provider value={{ 
      sampler, 
      isLoaded, 
      playNote, 
      stopNote, 
      stopAllNotes,
      scheduleNote,
      activeNotes 
    }}>
      {children}
    </AudioContext.Provider>
  );
}; 