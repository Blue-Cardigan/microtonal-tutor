'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAudio } from '../utils/AudioContext';
import * as Tone from 'tone';

// Import types
import { Scale, Chord, ScaleBrowserProps } from '../types/scale';

// Import utility functions
import { invertChord } from '../utils/scaleUtils';
import { generateChordsForScale } from '../utils/chordUtils';
import { 
  loadScaleFamilies, 
  loadScalesForFamily, 
  extractCategories, 
  filterAndSortScales 
} from '../utils/dataUtils';

// Import components
import ScaleList from './ScaleList';
import ChordDisplay from './ChordDisplay';
// Kept for future use but currently unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AdvancedScaleSearch from './AdvancedScaleSearch';

const ScaleBrowser: React.FC<ScaleBrowserProps> = ({ onHighlightNotes, onChordSelect, onScaleSelect }) => {
  const { playNote, stopAllNotes, scheduleNote, isLoaded } = useAudio();
  
  // Core data state
  const [families, setFamilies] = useState<string[]>([]);
  // Used for future feature but currently not implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Selection state
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [scaleIndex, setScaleIndex] = useState<number>(0);
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
  const [lastChordKey, setLastChordKey] = useState<string | null>(null);
  
  // UI state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  // Kept for future toggle between basic and advanced modes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [viewMode] = useState<'basic' | 'advanced'>('basic');
  
  // Chord state
  const [useSeventhChords, setUseSeventhChords] = useState<boolean>(false);
  const [currentInversion, setCurrentInversion] = useState<number>(0);
  const [useAutoInversion, setUseAutoInversion] = useState<boolean>(false);
  const [useTraditionalChords, setUseTraditionalChords] = useState<boolean>(true);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'noteCount' | 'brightness'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Scheduled events tracking
  const [scheduledEvents, setScheduledEvents] = useState<number[]>([]);
  
  // Modified state to support lazy loading
  const [familyMetadata, setFamilyMetadata] = useState<Record<string, { name: string, count: number }>>({});
  const [currentFamilyScales, setCurrentFamilyScales] = useState<Scale[]>([]);
  const [isLoadingFamily, setIsLoadingFamily] = useState<boolean>(false);
  
  // Change this check to use families instead of scaleData
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  
  // Load family metadata on component mount (lightweight operation)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialLoading(true);
        // Only load the family metadata first (lightweight)
        const familyData = await loadScaleFamilies();
        setFamilies(Object.keys(familyData));
        setFamilyMetadata(familyData);
        
        // Set default selections for family
        if (Object.keys(familyData).length > 0) {
          const firstFamily = Object.keys(familyData)[0];
          setSelectedFamily(firstFamily);
        }
      } catch (error) {
        console.error('Error loading scale family metadata:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Load scales for selected family when it changes
  useEffect(() => {
    const loadFamilyScales = async () => {
      if (!selectedFamily) return;
      
      try {
        setIsLoadingFamily(true);
        // Load scales only for the selected family
        const scales = await loadScalesForFamily(selectedFamily);
        setCurrentFamilyScales(scales);
        
        // Set default selected scale
        if (scales.length > 0) {
          setSelectedScale(scales[0]);
          setScaleIndex(0);
        } else {
          setSelectedScale(null);
          setScaleIndex(-1);
        }
        
        // Extract categories from current family scales
        const categories = extractCategories({ 
          title: "31-EDO Scales", 
          families: { [selectedFamily]: { name: familyMetadata[selectedFamily]?.name || selectedFamily, scales } } 
        });
        setAvailableCategories(categories);
        
      } catch (error) {
        console.error(`Error loading scales for family ${selectedFamily}:`, error);
      } finally {
        setIsLoadingFamily(false);
      }
    };
    
    loadFamilyScales();
    
    // Reset filters when changing families
    setSearchTerm('');
    setSelectedCategory('all');
    setNoteCount(null);
  }, [selectedFamily, familyMetadata]);
  
  // Calculate filtered scales using useMemo (optimized to use currentFamilyScales)
  const filteredScales = useMemo(() => {
    return filterAndSortScales(
      currentFamilyScales,
      searchTerm,
      selectedCategory,
      noteCount,
      sortBy,
      sortDirection
    );
  }, [currentFamilyScales, searchTerm, selectedCategory, noteCount, sortBy, sortDirection]);
  
  // Update handleFamilyChange to be callback-friendly
  const handleFamilyChange = useCallback((family: string) => {
    setSelectedFamily(family);
  }, []);
  
  // Update selected scale index when filtered scales change
  useEffect(() => {
    if (filteredScales.length > 0) {
      if (!selectedScale || !filteredScales.includes(selectedScale)) {
        setSelectedScale(filteredScales[0]);
        setScaleIndex(0);
      } else {
        const newIndex = filteredScales.indexOf(selectedScale);
        setScaleIndex(newIndex >= 0 ? newIndex : 0);
      }
    } else if (filteredScales.length === 0) {
      setSelectedScale(null);
    }
  }, [filteredScales, selectedScale]);
  
  // Memoize generated chords to prevent unnecessary recalculations
  const generatedChords = useMemo(() => {
    if (!selectedScale) {
      return { triads: [], sevenths: [], traditionalTriads: [], traditionalSevenths: [] };
    }
    return generateChordsForScale(selectedScale);
  }, [selectedScale]);
  
  // Update parent components when selected scale changes
  useEffect(() => {
    if (!selectedScale) return;
    
    // Notify parent about scale selection
    if (onScaleSelect) {
      onScaleSelect({
        name: selectedScale.name,
        degrees: selectedScale.degrees
      });
    }
    
    // Update highlighted notes
    if (onHighlightNotes) {
      onHighlightNotes(new Set(selectedScale.degrees), 'scale');
    }
    
    // Clear any selected chord when scale changes
    setSelectedChord(null);
  }, [selectedScale, onScaleSelect, onHighlightNotes]);
  
  // Clear scheduled events on unmount
  useEffect(() => {
    return () => {
      scheduledEvents.forEach(id => Tone.Transport.clear(id));
    };
  }, [scheduledEvents]);
  
  // Play a scale
  const playScale = useCallback(() => {
    if (!selectedScale || isPlaying || !isLoaded) return;
    
    setIsPlaying(true);
    
    // Clear any previous scheduled events
    scheduledEvents.forEach(id => Tone.Transport.clear(id));
    setScheduledEvents([]);
    
    // Ensure all previously playing notes are stopped
    stopAllNotes(0.1);
    
    // Clear any previous highlights before starting
    if (onHighlightNotes) {
      onHighlightNotes(new Set(), 'scale');
    }
    
    const notes = selectedScale.degrees;
    const now = Tone.now();
    const duration = 0.3;
    const spacing = 0.35;
    
    // Track whether the component is still mounted
    let isMounted = true;
    
    // Set initial highlighted note (first note of the scale) with a small delay
    // to ensure it's visible before the first note plays
    setTimeout(() => {
      if (!isMounted) return; // Don't update if unmounted
      
      if (onHighlightNotes && notes.length > 0) {
        onHighlightNotes(new Set([notes[0]]), 'scale');
      }
    }, 50); // Small delay to ensure UI updates before sound plays
    
    // Schedule notes to play in sequence
    const newEvents: number[] = [];
    notes.forEach((note, index) => {
      const time = now + (index * spacing);
      
      // For all notes, schedule highlighting to happen just before the note plays
      // (including the first note, as a backup in case the setTimeout above fails)
      const highlightTime = Math.max(now, time - 0.08); // At least 80ms before note plays
      const highlightEventId = Tone.Transport.schedule(() => {
        if (!isMounted) return; // Don't update if unmounted
        
        if (onHighlightNotes) {
          onHighlightNotes(new Set([note]), 'scale');
        }
      }, highlightTime);
      
      if (highlightEventId !== undefined) {
        newEvents.push(highlightEventId);
      }
      
      // Schedule the actual note playback
      const eventId = scheduleNote(note, time, duration);
      if (eventId !== undefined) {
        newEvents.push(eventId);
      }
    });
    
    setScheduledEvents(newEvents);
    
    // Schedule a callback to update the playing state when done
    const totalDuration = (notes.length * spacing) + 0.1;
    const timerId = window.setTimeout(() => {
      if (!isMounted) return; // Don't update if unmounted
      
      setIsPlaying(false);
      
      // Ensure all notes are stopped to clear blue highlights
      stopAllNotes(0.1);
      
      // Clear highlighted notes first (prevents flashing of scale notes)
      if (onHighlightNotes) {
        onHighlightNotes(new Set(), 'scale');
      }
      
      // Small delay to prevent UI flash, then reset to showing the full scale
      setTimeout(() => {
        if (!isMounted) return; // Don't update if unmounted
        
        // Reset highlighted notes to show all scale degrees when done
        if (selectedScale && onHighlightNotes) {
          onHighlightNotes(new Set(selectedScale.degrees), 'scale');
        }
      }, 200);
    }, totalDuration * 1000);
    
    return () => {
      // Mark as unmounted
      isMounted = false;
      
      // Clear all timeouts and scheduled events
      clearTimeout(timerId);
      newEvents.forEach(id => Tone.Transport.clear(id));
      
      // Also ensure we stop all notes 
      stopAllNotes(0.1);
      
      // And clear highlighted notes
      if (onHighlightNotes) {
        onHighlightNotes(new Set(), 'scale');
      }
    };
  }, [selectedScale, isPlaying, isLoaded, scheduleNote, scheduledEvents, onHighlightNotes, stopAllNotes]);
  
  const enhancedStopAllNotes = useCallback((releaseTime?: number) => {
    // First, stop all notes using the audio context's stopAllNotes
    stopAllNotes(releaseTime);
    
    // Then, deselect the chord
    setSelectedChord(null);
    
    // Also notify parent about chord deselection
    if (onChordSelect) {
      onChordSelect(null);
    }
    
    // If a scale is selected, highlight scale degrees
    if (selectedScale && onHighlightNotes) {
      onHighlightNotes(new Set(selectedScale.degrees), 'scale');
    }
  }, [stopAllNotes, onChordSelect, onHighlightNotes, selectedScale]);
  
  // Play a chord
  const playChord = useCallback((chord: Chord) => {
    if (!isLoaded) return;
    
    // Stop any currently playing notes
    enhancedStopAllNotes();
    
    // Apply inversion if needed
    let notesToPlay = [...chord.notes];
    
    if (useAutoInversion) {
      // Auto-inversion to keep notes within an octave
      notesToPlay = invertChord(chord.notes, 0, 1);
    } else if (currentInversion > 0) {
      // Manual inversion
      notesToPlay = invertChord(chord.notes, currentInversion);
    }
    
    // Play all notes in the chord simultaneously
    notesToPlay.forEach(note => {
      playNote(note);
    });
    
    // Update highlighted notes
    if (onHighlightNotes) {
      onHighlightNotes(new Set(notesToPlay), 'chord');
    }
    
    // Notify parent component about chord selection
    if (onChordSelect) {
      onChordSelect({
        notes: notesToPlay,
        type: chord.type,
        degreeRoman: chord.degreeRoman
      });
    }
    
    // Update selected chord state
    setSelectedChord(chord);
  }, [isLoaded, enhancedStopAllNotes, playNote, onHighlightNotes, onChordSelect, currentInversion, useAutoInversion]);
  
  // Handle chord selection
  const handleChordSelect = useCallback((chord: Chord | null) => {
    setSelectedChord(chord);
    
    if (!chord) {
      // If deselecting a chord, highlight the scale notes again
      if (selectedScale && onHighlightNotes) {
        onHighlightNotes(new Set(selectedScale.degrees), 'scale');
      }
      
      // Notify parent component about chord deselection
      if (onChordSelect) {
        onChordSelect(null);
      }
    }
  }, [selectedScale, onHighlightNotes, onChordSelect]);
  
  // Handle scale selection from the list
  const handleScaleSelect = useCallback((scale: Scale, index: number) => {
    setSelectedScale(scale);
    setScaleIndex(index);
  }, []);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setNoteCount(null);
    setSortBy('name');
    setSortDirection('asc');
  }, []);
  
  // Handle keyboard events for navigation and chord playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in a text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // Only handle keys that are specifically used in ScaleBrowser
      // Check if this is a key we want to handle in this component
      const scaleNavigationKeys = ['arrowleft', 'arrowright', ' ', 'p'];
      const chordKeys = ['1', '2', '3', '4', '5', '6', '7']; 
      const inversionKeys = ['8', '9', '0', '-', '=']; 
      
      const isScaleBrowserKey = 
        scaleNavigationKeys.includes(key) || 
        chordKeys.includes(key) || 
        inversionKeys.includes(key);
      
      if (!isScaleBrowserKey) {
        // Let other key handlers in the app process this key
        return;
      }
      
      // Prevent duplicate key events only for ScaleBrowser-specific keys
      if (activeKeys.has(key)) return;
      
      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.add(key);
      setActiveKeys(newActiveKeys);
      
      // Handle navigation keys
      if (key === ' ') {
        e.preventDefault();
        playScale();
      }
      
      // Handle chord keys (1-7)
      const chordKeyMatch = key.match(/^[1-7]$/);
      if (chordKeyMatch && generatedChords) {
        const chordIndex = parseInt(key) - 1;
        const chords = useTraditionalChords
          ? (useSeventhChords ? generatedChords.traditionalSevenths : generatedChords.traditionalTriads)
          : (useSeventhChords ? generatedChords.sevenths : generatedChords.triads);
        
        if (chordIndex >= 0 && chordIndex < chords.length) {
          const chord = chords[chordIndex];
          playChord(chord);
          setLastChordKey(key);
        }
      }
      
      // Handle inversion keys (8, 9, 0, -, =)
      if (key === '8') {
        // Root position (0)
        setCurrentInversion(0);
        setUseAutoInversion(false);
        if (selectedChord) playChord(selectedChord);
      } else if (key === '9') {
        // First inversion (1)
        setCurrentInversion(1);
        setUseAutoInversion(false);
        if (selectedChord) playChord(selectedChord);
      } else if (key === '0') {
        // Second inversion (2)
        setCurrentInversion(2);
        setUseAutoInversion(false);
        if (selectedChord) playChord(selectedChord);
      } else if (key === '-') {
        // Third inversion (3) - only for seventh chords
        if (useSeventhChords) {
          setCurrentInversion(3);
          setUseAutoInversion(false);
          if (selectedChord) playChord(selectedChord);
        }
      } else if (key === '=') {
        // Auto inversion
        setUseAutoInversion(!useAutoInversion);
        if (selectedChord) playChord(selectedChord);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Only process keys that ScaleBrowser handles
      const scaleNavigationKeys = ['arrowleft', 'arrowright', ' ', 'p'];
      const chordKeys = ['1', '2', '3', '4', '5', '6', '7']; 
      const inversionKeys = ['8', '9', '0', '-', '=']; 
      
      const isScaleBrowserKey = 
        scaleNavigationKeys.includes(key) || 
        chordKeys.includes(key) || 
        inversionKeys.includes(key);
      
      if (!isScaleBrowserKey) {
        // Let other key handlers in the app process this key
        return;
      }
      
      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.delete(key);
      setActiveKeys(newActiveKeys);
      
      // Stop chord playback when a chord key (1-7) is released
      const chordKeyMatch = key.match(/^[1-7]$/);
      if (chordKeyMatch && key === lastChordKey) {
        enhancedStopAllNotes(0.2); // Stop with a short release time for a natural decay
        setLastChordKey(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    activeKeys, 
    playScale, 
    generatedChords, 
    useSeventhChords, 
    selectedChord, 
    playChord,
    currentInversion,
    useAutoInversion,
    lastChordKey,
    enhancedStopAllNotes,
    useTraditionalChords,
  ]);

  // Update the loading state check
  if (isInitialLoading) {
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

  // Handle case where we have no selected scale (but families are loaded)
  if (!selectedScale) {
    return (
      <div>
          {/* Family selection dropdown */}
          <div className="mb-4">
            <label htmlFor="family-select-empty" className="block text-sm font-medium text-gray-700 mb-1">
              Select a different scale family:
            </label>
            <select
              id="family-select-empty"
              className="w-full p-2 border text-gray-800 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedFamily}
              onChange={(e) => handleFamilyChange(e.target.value)}
            >
              {families.map(family => (
                <option key={family} value={family}>
                  {familyMetadata[family]?.name || family}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Scale Browser</h2>
      </div>

      {/* Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Sidebar - Scale Selection and Info */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-lg">
            {/* Scale List - now with integrated family selector */}
            <div className="gap-2">
              {isLoadingFamily ? (
                <div className="flex justify-center items-center h-32">
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Loading scales...</span>
                  </div>
                </div>
              ) : (
                <ScaleList
                  scales={filteredScales}
                  selectedIndex={scaleIndex}
                  onSelectScale={handleScaleSelect}
                  familyName={familyMetadata[selectedFamily]?.name || selectedFamily}
                  isPlaying={isPlaying}
                  isLoaded={isLoaded}
                  playScale={playScale}
                  families={families}
                  selectedFamily={selectedFamily}
                  onFamilyChange={handleFamilyChange}
                  scaleData={{ 
                    title: "31-EDO Scales", 
                    families: familyMetadata as Record<string, { name: string, count: number, scales: Scale[] }>
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Chord Display */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-lg shadow-sm">
            <ChordDisplay
              triads={generatedChords.triads}
              sevenths={generatedChords.sevenths}
              traditionalTriads={generatedChords.traditionalTriads}
              traditionalSevenths={generatedChords.traditionalSevenths}
              selectedChord={selectedChord}
              useSeventhChords={useSeventhChords}
              setUseSeventhChords={setUseSeventhChords}
              useTraditionalChords={useTraditionalChords}
              setUseTraditionalChords={setUseTraditionalChords}
              currentInversion={currentInversion}
              setCurrentInversion={setCurrentInversion}
              useAutoInversion={useAutoInversion}
              setUseAutoInversion={setUseAutoInversion}
              onChordSelect={handleChordSelect}
              onPlayChord={playChord}
              stopAllNotes={enhancedStopAllNotes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScaleBrowser;