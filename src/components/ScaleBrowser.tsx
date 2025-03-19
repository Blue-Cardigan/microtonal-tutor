'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAudio } from '../utils/AudioContext';
import * as Tone from 'tone';

// Import types
import { Scale, Chord, ScaleBrowserProps, ScaleData } from '../types/scale';

// Import utility functions
import { invertChord } from '../utils/scaleUtils';
import { generateChordsForScale } from '../utils/chordUtils';
import { loadScaleData, extractCategories, filterAndSortScales } from '../utils/dataUtils';

// Import components
import ViewModeToggle from './ViewModeToggle';
import ScaleSearchFilter from './ScaleSearchFilter';
import FamilySelector from './FamilySelector';
import ScaleList from './ScaleList';
import ScaleInfo from './ScaleInfo';
import ChordDisplay from './ChordDisplay';

const ScaleBrowser: React.FC<ScaleBrowserProps> = ({ onHighlightNotes, onChordSelect, onScaleSelect }) => {
  const { playNote, stopAllNotes, scheduleNote, isLoaded } = useAudio();
  
  // Core data state
  const [scaleData, setScaleData] = useState<ScaleData | null>(null);
  const [families, setFamilies] = useState<string[]>([]);
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
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  
  // Chord state
  const [useSeventhChords, setUseSeventhChords] = useState<boolean>(false);
  const [currentInversion, setCurrentInversion] = useState<number>(0);
  const [useAutoInversion, setUseAutoInversion] = useState<boolean>(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'noteCount' | 'brightness'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Scheduled events tracking
  const [scheduledEvents, setScheduledEvents] = useState<number[]>([]);
  
  // Load scale data on component mount
  useEffect(() => {
    const fetchScaleData = async () => {
      try {
        const data = await loadScaleData();
        setScaleData(data);
        
        // Get family names
        const familyNames = Object.keys(data.families);
        setFamilies(familyNames);
        
        // Extract available categories
        const categories = extractCategories(data);
        setAvailableCategories(categories);
        
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
    
    fetchScaleData();
  }, []);
  
  // Calculate filtered scales using useMemo to prevent unnecessary recalculations
  const filteredScales = useMemo(() => {
    if (!scaleData || !selectedFamily || !scaleData.families[selectedFamily]) {
      return [];
    }
    
    const scales = scaleData.families[selectedFamily].scales;
    return filterAndSortScales(
      scales,
      searchTerm,
      selectedCategory,
      noteCount,
      sortBy,
      sortDirection
    );
  }, [scaleData, selectedFamily, searchTerm, selectedCategory, noteCount, sortBy, sortDirection]);
  
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
      return { triads: [], sevenths: [] };
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
      onHighlightNotes(new Set(selectedScale.degrees));
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
    
    const notes = selectedScale.degrees;
    const now = Tone.now();
    const duration = 0.3;
    const spacing = 0.35;
    
    // Schedule notes to play in sequence
    const newEvents: number[] = [];
    notes.forEach((note, index) => {
      const time = now + (index * spacing);
      const eventId = scheduleNote(note, time, duration);
      if (eventId !== undefined) {
        newEvents.push(eventId);
      }
    });
    
    setScheduledEvents(newEvents);
    
    // Schedule a callback to update the playing state when done
    const totalDuration = (notes.length * spacing) + 0.1;
    const timerId = window.setTimeout(() => {
      setIsPlaying(false);
    }, totalDuration * 1000);
    
    return () => {
      clearTimeout(timerId);
      newEvents.forEach(id => Tone.Transport.clear(id));
    };
  }, [selectedScale, isPlaying, isLoaded, scheduleNote, scheduledEvents]);
  
  // Play a chord
  const playChord = useCallback((chord: Chord) => {
    if (!isLoaded) return;
    
    // Stop any currently playing notes
    stopAllNotes();
    
    // Apply inversion if needed
    let notesToPlay = [...chord.notes];
    
    if (useAutoInversion) {
      // Auto-inversion to keep notes within an octave
      notesToPlay = invertChord(chord.notes, 0, 1);
      console.log('Auto-inverted chord:', notesToPlay);
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
      onHighlightNotes(new Set(notesToPlay));
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
  }, [isLoaded, stopAllNotes, playNote, onHighlightNotes, onChordSelect, currentInversion, useAutoInversion]);
  
  // Handle chord selection
  const handleChordSelect = useCallback((chord: Chord | null) => {
    setSelectedChord(chord);
    
    if (!chord) {
      // If deselecting a chord, highlight the scale notes again
      if (selectedScale && onHighlightNotes) {
        onHighlightNotes(new Set(selectedScale.degrees));
      }
      
      // Notify parent component about chord deselection
      if (onChordSelect) {
        onChordSelect(null);
      }
    }
  }, [selectedScale, onHighlightNotes, onChordSelect]);
  
  // Handle previous scale selection
  const handlePrevScale = useCallback(() => {
    if (filteredScales.length === 0) return;
    
    const newIndex = (scaleIndex - 1 + filteredScales.length) % filteredScales.length;
    setScaleIndex(newIndex);
    setSelectedScale(filteredScales[newIndex]);
  }, [filteredScales, scaleIndex]);
  
  // Handle next scale selection
  const handleNextScale = useCallback(() => {
    if (filteredScales.length === 0) return;
    
    const newIndex = (scaleIndex + 1) % filteredScales.length;
    setScaleIndex(newIndex);
    setSelectedScale(filteredScales[newIndex]);
  }, [filteredScales, scaleIndex]);
  
  // Handle family change
  const handleFamilyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const family = e.target.value;
    setSelectedFamily(family);
    
    // Reset filters when changing families
    setSearchTerm('');
    setSelectedCategory('all');
    setNoteCount(null);
  }, []);
  
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
      
      // Prevent duplicate key events
      if (activeKeys.has(key)) return;
      
      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.add(key);
      setActiveKeys(newActiveKeys);
      
      // Handle navigation keys
      if (key === 'arrowleft') {
        handlePrevScale();
      } else if (key === 'arrowright') {
        handleNextScale();
      } else if (key === ' ' || key === 'p') {
        // Space or P to play the scale
        e.preventDefault();
        playScale();
      }
      
      // Handle chord keys (1-7)
      const chordKeyMatch = key.match(/^[1-7]$/);
      if (chordKeyMatch && generatedChords) {
        const chordIndex = parseInt(key) - 1;
        const chords = useSeventhChords ? generatedChords.sevenths : generatedChords.triads;
        
        if (chordIndex >= 0 && chordIndex < chords.length) {
          const chord = chords[chordIndex];
          playChord(chord);
          // Store the key that played this chord for reference in keyup handler
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
      
      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.delete(key);
      setActiveKeys(newActiveKeys);
      
      // Stop chord playback when a chord key (1-7) is released
      const chordKeyMatch = key.match(/^[1-7]$/);
      if (chordKeyMatch && key === lastChordKey) {
        stopAllNotes(0.2); // Stop with a short release time for a natural decay
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
    handlePrevScale, 
    handleNextScale, 
    generatedChords, 
    useSeventhChords, 
    selectedChord, 
    playChord,
    currentInversion,
    useAutoInversion,
    lastChordKey,
    stopAllNotes
  ]);

  // Render loading state
  if (!scaleData) {
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

  // Handle case where we have scaleData but no selectedScale
  if (!selectedScale) {
    return (
      <div>
        {/* View Mode Toggle */}
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
        
        {/* Search and Filter Section */}
        <div className={`mb-6 ${viewMode === 'basic' ? 'hidden' : ''}`}>
          <ScaleSearchFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            availableCategories={availableCategories}
            noteCount={noteCount}
            setNoteCount={setNoteCount}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            filteredScalesCount={filteredScales.length}
            resetFilters={resetFilters}
          />
        </div>
        
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 font-medium mb-2">No scales found matching your criteria</div>
            <div className="text-gray-600 text-sm mb-4">
              Try adjusting your search terms or filters.
              <br />
              <span className="text-xs mt-2 block">
                Debug info: {families.length} families available, 
                {selectedFamily ? ` "${selectedFamily}" selected` : " no family selected"}
              </span>
            </div>
            
            {/* Family selection dropdown */}
            <div className="mb-4">
              <label htmlFor="family-select-empty" className="block text-sm font-medium text-gray-700 mb-1">
                Select a different scale family:
              </label>
              <select
                id="family-select-empty"
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
            
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      
      {/* Search and Filter Section */}
      <div className={`mb-6 ${viewMode === 'basic' ? 'hidden' : ''}`}>
        <ScaleSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          availableCategories={availableCategories}
          noteCount={noteCount}
          setNoteCount={setNoteCount}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          filteredScalesCount={filteredScales.length}
          resetFilters={resetFilters}
        />
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
            <FamilySelector
              families={families}
              selectedFamily={selectedFamily}
              onFamilyChange={handleFamilyChange}
              scaleData={scaleData}
            />
            
            {/* Scale List - Only shown in advanced mode */}
            {viewMode === 'advanced' && (
              <ScaleList
                scales={filteredScales}
                selectedIndex={scaleIndex}
                onSelectScale={handleScaleSelect}
                familyName={scaleData.families[selectedFamily].name}
              />
            )}
          </div>
          
          <div className="w-full md:w-2/3 flex flex-col">
            <ScaleInfo
              scale={selectedScale}
              isPlaying={isPlaying}
              isLoaded={isLoaded}
              playScale={playScale}
            />
          </div>
        </div>
      </div>
      
      {/* Chord Display */}
      <div className="mb-6">
        <ChordDisplay
          triads={generatedChords.triads}
          sevenths={generatedChords.sevenths}
          selectedChord={selectedChord}
          useSeventhChords={useSeventhChords}
          setUseSeventhChords={setUseSeventhChords}
          currentInversion={currentInversion}
          setCurrentInversion={setCurrentInversion}
          useAutoInversion={useAutoInversion}
          setUseAutoInversion={setUseAutoInversion}
          onChordSelect={handleChordSelect}
          onPlayChord={playChord}
          stopAllNotes={stopAllNotes}
        />
      </div>
    </div>
  );
};

export default ScaleBrowser;