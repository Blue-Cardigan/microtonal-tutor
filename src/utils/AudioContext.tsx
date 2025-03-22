'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import * as Tone from 'tone';

// Sound source options
export type SoundSource = 'synth' | 'rhodes';

interface AudioContextType {
  synth: Tone.PolySynth | null;
  sampler: Tone.Sampler | null;
  isLoaded: boolean;
  playNote: (note: number) => void;
  stopNote: (note: number, releaseTime?: number) => void;
  stopAllNotes: (releaseTime?: number) => void;
  scheduleNote: (note: number, time?: number, duration?: number) => void;
  activeNotes: Set<number>;
  soundSource: SoundSource;
  setSoundSource: (source: SoundSource) => void;
}

const AudioContext = createContext<AudioContextType>({
  synth: null,
  sampler: null,
  isLoaded: false,
  playNote: () => {},
  stopNote: () => {},
  stopAllNotes: () => {},
  scheduleNote: () => {},
  activeNotes: new Set(),
  soundSource: 'rhodes',
  setSoundSource: () => {},
});

export const useAudio = () => useContext(AudioContext);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [synthLoaded, setSynthLoaded] = useState(false);
  const [samplerLoaded, setSamplerLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  // Track the currently playing notes with their frequencies
  const [playingNotes, setPlayingNotes] = useState<Map<number, number>>(new Map());
  // Current sound source
  const [soundSource, setSoundSource] = useState<SoundSource>('rhodes');
  
  // Store timeout IDs for cleanup
  const timeoutIds = useRef(new Map<number, number>());
  
  // Helper to cleanup a note from all state
  const cleanupNote = useCallback((note: number) => {
    // Remove from active notes
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      console.log(`👈 After removing note ${note}, active notes: [${Array.from(newSet).join(', ')}]`);
      return newSet;
    });
    
    // Also remove from playingNotes map for complete cleanup
    setPlayingNotes(prev => {
      const newMap = new Map(prev);
      newMap.delete(note);
      return newMap;
    });
    
    // Clear any timeout
    const timerId = timeoutIds.current.get(note);
    if (timerId) {
      clearTimeout(timerId);
      timeoutIds.current.delete(note);
    }
  }, []);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutIds.current.forEach(id => clearTimeout(id));
      timeoutIds.current.clear();
    };
  }, []);

  // Make sure Tone.Transport is started
  useEffect(() => {
    // Initialize Tone.js
    const startAudio = async () => {
      // Only start after a user interaction
      await Tone.start();
      // Make sure the Transport is started for scheduled events
      if (Tone.Transport.state !== "started") {
        console.log("🎵 Starting Tone.Transport");
        Tone.Transport.start();
      }
    };

    // Attempt to start on mount, but it might need user interaction
    startAudio().catch(err => {
      console.log("Tone.js not started yet, waiting for user interaction", err);
    });

    // Setup event listener for user interaction
    const handleInteraction = async () => {
      if (Tone.context.state !== "running") {
        await startAudio();
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("keydown", handleInteraction);
      }
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      // Don't stop Transport on cleanup as it might affect other components
    };
  }, []);

  // Create and configure the synth
  useEffect(() => {
    // Create a PolySynth which is designed for playing multiple notes simultaneously
    const newSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle', // More mellow sound similar to rhodes
      },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.4,
        release: 0.2,
      },
      volume: -8, // Slightly quieter than default
    }).toDestination();
    
    setSynth(newSynth);
    setSynthLoaded(true);

    return () => {
      // Ensure all notes are stopped before disposing
      newSynth.releaseAll();
      newSynth.dispose();
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
        setSamplerLoaded(true);
        console.log("Sampler loaded");
      },
      release: 0.2, // Release time for smoother transitions
      attack: 0.01,
      volume: -6, // Volume level
    }).toDestination();

    setSampler(newSampler);

    return () => {
      // Ensure all notes are stopped before disposing
      newSampler.releaseAll();
      newSampler.dispose();
    };
  }, []);

  // Track overall loading status based on the current sound source
  const isLoaded = useCallback(() => {
    return soundSource === 'synth' ? synthLoaded : samplerLoaded;
  }, [soundSource, synthLoaded, samplerLoaded]);

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
    // Determine which sound source to use
    const usingRhodes = soundSource === 'rhodes' && sampler && samplerLoaded;
    const usingSynth = soundSource === 'synth' && synth && synthLoaded;
    
    if (!usingRhodes && !usingSynth) return;
    
    try {
      const freq = stepToFrequency(note);
      
      // Check if this note is already playing
      if (playingNotes.has(note)) {
        return;
      }
      
      // Store the frequency for this note
      setPlayingNotes(prev => {
        const newMap = new Map(prev);
        newMap.set(note, freq);
        return newMap;
      });
      
      // Trigger the note with the appropriate sound source
      if (usingRhodes) {
        sampler.triggerAttack(freq);
      } else if (usingSynth) {
        synth.triggerAttack(freq);
      }
      
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
    } catch (error) {
      console.error("Error playing note:", error);
    }
  }, [synth, sampler, soundSource, synthLoaded, samplerLoaded, stepToFrequency, playingNotes]);

  const stopNote = useCallback((note: number, releaseTime: number = 0.1) => {
    // Determine which sound source to use
    const usingRhodes = soundSource === 'rhodes' && sampler && samplerLoaded;
    const usingSynth = soundSource === 'synth' && synth && synthLoaded;
    
    if (!usingRhodes && !usingSynth) return;
    
    try {
      // Get the frequency for this note from our map
      const freq = playingNotes.get(note);
      
      if (freq) {
        // Release the note with the appropriate sound source
        if (usingRhodes) {
          sampler.triggerRelease(freq);
        } else if (usingSynth) {
          synth.triggerRelease(freq);
        }
        
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
  }, [synth, sampler, soundSource, synthLoaded, samplerLoaded, playingNotes]);

  const stopAllNotes = useCallback((releaseTime: number = 0.1) => {
    // Determine which sound source to use
    const usingRhodes = soundSource === 'rhodes' && sampler && samplerLoaded;
    const usingSynth = soundSource === 'synth' && synth && synthLoaded;
    
    if (!usingRhodes && !usingSynth) return;
    
    try {
      console.log("⚠️ Stopping ALL notes and clearing state");
      
      // Release all notes with the appropriate sound source
      if (usingRhodes) {
        sampler.releaseAll();
      } else if (usingSynth) {
        synth.releaseAll();
      }
      
      // Clear all timeouts
      timeoutIds.current.forEach(id => clearTimeout(id));
      timeoutIds.current.clear();
      
      // Clear our tracking maps
      setPlayingNotes(new Map());
      setActiveNotes(new Set());
    } catch (error) {
      console.error("Error stopping all notes:", error);
    }
  }, [synth, sampler, soundSource, synthLoaded, samplerLoaded]);

  // Enhanced method to schedule a note to play for a specific duration
  const scheduleNote = useCallback((note: number, time = Tone.now(), duration = 0.3) => {
    // Determine which sound source to use
    const usingRhodes = soundSource === 'rhodes' && sampler && samplerLoaded;
    const usingSynth = soundSource === 'synth' && synth && synthLoaded;
    
    if (!usingRhodes && !usingSynth) return;
    
    try {
      const freq = stepToFrequency(note);
      
      // Log scheduling information
      console.log(`🎵 Scheduling note ${note} at time ${time.toFixed(2)} for duration ${duration.toFixed(2)}`);
      
      // Add to active notes immediately for visual feedback
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        console.log(`👉 Adding note ${note} to activeNotes, now active: [${Array.from(newSet).join(', ')}]`);
        return newSet;
      });
      
      // Schedule the note with the appropriate sound source
      if (usingRhodes) {
        sampler.triggerAttackRelease(freq, duration, time);
      } else if (usingSynth) {
        synth.triggerAttackRelease(freq, duration, time);
      }
      
      // Schedule removal from active notes using Tone.Transport for precise timing
      const endTime = time + duration;
      console.log(`🔄 Scheduling cleanup for note ${note} at time ${endTime.toFixed(2)}`);
      
      // We'll use both a Transport event and a setTimeout as a backup
      const eventId = Tone.Transport.schedule(() => {
        console.log(`🛑 Removing note ${note} from activeNotes at time ${Tone.now().toFixed(2)} via Transport`);
        cleanupNote(note);
      }, endTime);
      
      // Backup cleanup with setTimeout in case Transport events are unreliable
      const msTime = (endTime - Tone.now()) * 1000 + 50; // Add 50ms buffer
      const timerId = window.setTimeout(() => {
        console.log(`🛑 Backup cleanup for note ${note} at time ${Tone.now().toFixed(2)} via setTimeout`);
        cleanupNote(note);
      }, msTime);
      
      // Store the timeout ID to clear it if the component unmounts
      timeoutIds.current.set(note, timerId);
      
      // Return the event ID so the caller could cancel it if needed
      return eventId;
    } catch (error) {
      console.error("Error scheduling note:", error);
      return null;
    }
  }, [synth, sampler, soundSource, synthLoaded, samplerLoaded, stepToFrequency, cleanupNote]);

  return (
    <AudioContext.Provider value={{ 
      synth, 
      sampler,
      isLoaded: isLoaded(),
      playNote, 
      stopNote, 
      stopAllNotes,
      scheduleNote,
      activeNotes,
      soundSource,
      setSoundSource
    }}>
      {children}
    </AudioContext.Provider>
  );
}; 