'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // State variables for enhanced filtering and searching
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
  
  // Reference to track if we're in the middle of an update to prevent infinite loops
  const isUpdatingRef = useRef<boolean>(false);
  
  // Function to clear all scheduled events
  const clearAllScheduledEvents = useCallback(() => {
    scheduledEventsRef.current.forEach(eventId => {
      Tone.Transport.clear(eventId);
    });
    scheduledEventsRef.current = [];
  }, []);
  
  // Function to safely update highlighted notes
  const updateHighlightedNotes = useCallback((notes: Set<number>) => {
    // Check if the notes have actually changed to prevent unnecessary re-renders
    if (areSetsEqual(highlightedNotes, notes)) return;
    
    setHighlightedNotes(notes);
    if (onHighlightNotes) {
      onHighlightNotes(notes);
    }
  }, [onHighlightNotes, highlightedNotes]);
  
  // Helper function to compare sets
  const areSetsEqual = (a: Set<number>, b: Set<number>): boolean => {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  };
  
  // Load scale data
  useEffect(() => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    const fetchScaleData = async () => {
      try {
        isUpdatingRef.current = true;
        
        const data = await loadScaleData();
        setScaleData(data);
        
        // Get family names
        const familyNames = Object.keys(data.families);
        setFamilies(familyNames);
        
        // Log scale counts for debugging
        console.log("Loaded scale families:", 
          Object.entries(data.families).map(([key, family]) => 
            `${key}: ${family.scales.length} scales`
          )
        );
        
        // Extract available categories
        const categories = extractCategories(data);
        setAvailableCategories(categories);
        
        // Set default selections
        if (familyNames.length > 0) {
          setSelectedFamily(familyNames[0]);
          const firstFamily = data.families[familyNames[0]];
          if (firstFamily.scales.length > 0) {
            setSelectedScale(firstFamily.scales[0]);
            console.log(`Set initial scale to ${firstFamily.scales[0].name} from family ${familyNames[0]}`);
          } else {
            console.log(`First family ${familyNames[0]} has no scales`);
          }
        } else {
          console.log("No families found in merged data");
        }
        
        // Reset the updating flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      } catch (error) {
        console.error('Error loading scale data:', error);
        isUpdatingRef.current = false;
      }
    };
    
    fetchScaleData();
  }, []);
  
  // Generate chords when selected scale changes
  useEffect(() => {
    if (!selectedScale) return;
    
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    const chords = generateChordsForScale(selectedScale);
    setGeneratedChords(chords);
    
    // Notify parent component about scale selection
    if (onScaleSelect) {
      onScaleSelect({
        name: selectedScale.name,
        degrees: selectedScale.degrees
      });
    }
    
    // Clear any selected chord
    setSelectedChord(null);
    
    // Update highlighted notes to show scale degrees
    const scaleNotes = new Set(selectedScale.degrees);
    updateHighlightedNotes(scaleNotes);
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
    
  }, [selectedScale, onScaleSelect, updateHighlightedNotes]);
  
  // Filter and sort scales based on search criteria
  useEffect(() => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    console.log("Filter effect running with:", { 
      hasScaleData: !!scaleData, 
      selectedFamily, 
      searchTerm, 
      selectedCategory, 
      noteCount 
    });
    
    if (!scaleData || !selectedFamily) {
      console.log("Early return: missing scaleData or selectedFamily");
      return;
    }
    
    // Check if the family exists in scaleData
    if (!scaleData.families[selectedFamily]) {
      console.log(`Family "${selectedFamily}" not found in scaleData`);
      return;
    }
    
    const scales = scaleData.families[selectedFamily].scales;
    console.log(`Starting with ${scales.length} scales in family "${selectedFamily}"`);
    
    // Apply filters and sorting
    const filtered = filterAndSortScales(
      scales,
      searchTerm,
      selectedCategory,
      noteCount,
      sortBy,
      sortDirection
    );
    
    console.log(`After filtering and sorting: ${filtered.length} scales to display`);
    
    setFilteredScales(filtered);
    
    // Update scale selection if needed, but only if we're not already in the process of updating
    if (filtered.length > 0) {
      isUpdatingRef.current = true;
      
      // If there's no selected scale or the current selected scale is not in the filtered list
      if (!selectedScale || !filtered.includes(selectedScale)) {
        console.log("Updating selectedScale to first filtered scale");
        setSelectedScale(filtered[0]);
        setScaleIndex(0);
      } else {
        // If the selected scale is in the filtered list, update the index
        const newIndex = filtered.indexOf(selectedScale);
        console.log(`Selected scale found in filtered list at index ${newIndex}`);
        setScaleIndex(newIndex);
      }
      
      // Reset the updating flag after a short delay to ensure state updates have completed
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    } else if (filtered.length === 0) {
      console.log("No scales match filters, setting selectedScale to null");
      isUpdatingRef.current = true;
      setSelectedScale(null);
      
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    } else {
      console.log("Keeping current selectedScale");
    }
    
  // Remove selectedScale from the dependency array to break the circular dependency
  }, [scaleData, selectedFamily, searchTerm, selectedCategory, noteCount, sortBy, sortDirection, selectedScale]);
  
  // Play a scale
  const playScale = useCallback(() => {
    if (!selectedScale || isPlaying || !isLoaded || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    setIsPlaying(true);
    clearAllScheduledEvents();
    
    const notes = selectedScale.degrees;
    const now = Tone.now();
    const duration = 0.3;
    const spacing = 0.35;
    
    // Schedule notes to play in sequence
    notes.forEach((note, index) => {
      const time = now + (index * spacing);
      const eventId = scheduleNote(note, time, duration);
      if (eventId !== undefined) {
        scheduledEventsRef.current.push(eventId);
      }
    });
    
    // Schedule a callback to update the playing state when done
    const totalDuration = (notes.length * spacing) + 0.1;
    const timerId = window.setTimeout(() => {
      setIsPlaying(false);
      isUpdatingRef.current = false;
    }, totalDuration * 1000);
    
    return () => {
      clearTimeout(timerId);
      clearAllScheduledEvents();
      isUpdatingRef.current = false;
    };
  }, [selectedScale, isPlaying, isLoaded, clearAllScheduledEvents, scheduleNote]);
  
  // Play a chord
  const playChord = useCallback((chord: Chord) => {
    if (!isLoaded || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // Stop any currently playing notes
    stopAllNotes();
    
    // Apply inversion if needed
    let notesToPlay = [...chord.notes];
    
    if (useAutoInversion) {
      // For auto-inversion, we pass 1 as the autoInversionValue to ensure notes are kept within an octave
      notesToPlay = invertChord(chord.notes, 0, 1);
    } else if (currentInversion > 0) {
      // For manual inversions, we just pass the inversion number
      notesToPlay = invertChord(chord.notes, currentInversion);
    }
    
    // Play all notes in the chord simultaneously
    notesToPlay.forEach(note => {
      playNote(note);
    });
    
    // Update highlighted notes
    updateHighlightedNotes(new Set(notesToPlay));
    
    // Notify parent component about chord selection
    if (onChordSelect) {
      onChordSelect({
        notes: notesToPlay,
        type: chord.type,
        degreeRoman: chord.degreeRoman
      });
    }
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [isLoaded, stopAllNotes, currentInversion, useAutoInversion, playNote, updateHighlightedNotes, onChordSelect]);
  
  // Handle chord selection
  const handleChordSelect = useCallback((chord: Chord | null) => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    setSelectedChord(chord);
    
    if (!chord) {
      // If deselecting a chord, highlight the scale notes again
      if (selectedScale) {
        updateHighlightedNotes(new Set(selectedScale.degrees));
      }
      
      // Notify parent component about chord deselection
      if (onChordSelect) {
        onChordSelect(null);
      }
    }
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [selectedScale, updateHighlightedNotes, onChordSelect]);
  
  // Handle previous scale selection
  const handlePrevScale = useCallback(() => {
    if (filteredScales.length === 0 || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    const newIndex = (scaleIndex - 1 + filteredScales.length) % filteredScales.length;
    setScaleIndex(newIndex);
    setSelectedScale(filteredScales[newIndex]);
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [filteredScales, scaleIndex]);
  
  // Handle next scale selection
  const handleNextScale = useCallback(() => {
    if (filteredScales.length === 0 || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    const newIndex = (scaleIndex + 1) % filteredScales.length;
    setScaleIndex(newIndex);
    setSelectedScale(filteredScales[newIndex]);
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [filteredScales, scaleIndex]);
  
  // Handle keyboard events for navigation and chord playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in a text input or in the middle of an update
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          isUpdatingRef.current) {
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
      if (chordKeyMatch && !isUpdatingRef.current) {
        const chordIndex = parseInt(key) - 1;
        const chords = useSeventhChords ? generatedChords.sevenths : generatedChords.triads;
        
        if (chordIndex >= 0 && chordIndex < chords.length) {
          const chord = chords[chordIndex];
          
          // Always play the chord immediately
          playChord(chord);
          
          // Then update the selection state
          if (!selectedChord || selectedChord.degree !== chord.degree || selectedChord.type !== chord.type) {
            setSelectedChord(chord);
          }
        }
      }
      
      // Handle inversion keys (8, 9, 0, -, =)
      if (!isUpdatingRef.current) {
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
        } else if (key === '=' || key === 'a') {
          // Auto inversion (=) or 'a' key
          setUseAutoInversion(!useAutoInversion);
          if (selectedChord) playChord(selectedChord);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.delete(key);
      setActiveKeys(newActiveKeys);
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
    handleChordSelect,
    setCurrentInversion,
    setUseAutoInversion,
    useAutoInversion
  ]);

  // Handle family change
  const handleFamilyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    const family = e.target.value;
    console.log(`Family changed to: ${family}`);
    
    isUpdatingRef.current = true;
    
    setSelectedFamily(family);
    setScaleIndex(0);
    
    // Reset filters when changing families to ensure we see results
    setSearchTerm('');
    setSelectedCategory('all');
    setNoteCount(null);
    
    // Check if the family has scales
    if (scaleData && scaleData.families[family] && scaleData.families[family].scales.length > 0) {
      console.log(`Setting selected scale to first scale in family ${family}`);
      setSelectedScale(scaleData.families[family].scales[0]);
    } else {
      console.log(`Family ${family} has no scales, setting selectedScale to null`);
      setSelectedScale(null);
    }
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [scaleData]);
  
  // Handle scale selection from the list
  const handleScaleSelect = useCallback((scale: Scale, index: number) => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    setSelectedScale(scale);
    setScaleIndex(index);
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, []);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    setSearchTerm('');
    setSelectedCategory('all');
    setNoteCount(null);
    setSortBy('name');
    setSortDirection('asc');
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, []);
  
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
        />
      </div>
    </div>
  );
};

export default ScaleBrowser; 