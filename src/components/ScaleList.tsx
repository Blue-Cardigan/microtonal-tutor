import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scale } from '../types/scale';
import { formatName } from '../utils/IntervalUtils';

interface ScaleListProps {
  scales: Scale[];
  selectedIndex: number;
  onSelectScale: (scale: Scale, index: number) => void;
  familyName: string;
  isPlaying: boolean;
  isLoaded: boolean;
  playScale: () => void;
  families: string[];
  selectedFamily: string;
  onFamilyChange: (family: string) => void;
  scaleData: { 
    title: string, 
    families: Record<string, { name: string, count: number, scales?: Scale[] }> 
  } | null;
}

const ScaleList: React.FC<ScaleListProps> = ({ 
  scales, 
  selectedIndex, 
  onSelectScale,
  familyName,
  isPlaying,
  isLoaded,
  playScale,
  families,
  selectedFamily,
  onFamilyChange,
  scaleData
}) => {
  const [scrollToStart, setScrollToStart] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filteredScales, setFilteredScales] = useState<Scale[]>(scales);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'noteCount' | 'brightness'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('scaleFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
        setFavorites([]);
      }
    }
  }, []);
  
  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('scaleFavorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Memoize this function to prevent it from changing on every render
  const isScaleFavorite = useCallback((scale: Scale): boolean => {
    return favorites.includes(scale.name);
  }, [favorites]);
  
  // Apply filters when any filter criteria changes
  useEffect(() => {
    let result = [...scales];
    
    // Apply search filter
    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase();
      result = result.filter(scale => 
        scale.name.toLowerCase().includes(searchLower) || 
        (scale.description && scale.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply favorites filter
    if (showOnlyFavorites) {
      result = result.filter(scale => isScaleFavorite(scale));
    }
    
    // Apply note count filter
    if (noteCount !== null) {
      result = result.filter(scale => scale.degrees.length - 1 === noteCount);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'noteCount') {
        comparison = (a.degrees.length - 1) - (b.degrees.length - 1);
      } else if (sortBy === 'brightness') {
        const aBrightness = a.properties?.brightness ?? 0;
        const bBrightness = b.properties?.brightness ?? 0;
        comparison = Number(aBrightness) - Number(bBrightness);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredScales(result);
  }, [scales, localSearchTerm, showOnlyFavorites, noteCount, sortBy, sortDirection, isScaleFavorite]);
  
  // Toggle a scale as favorite
  const toggleFavorite = (scale: Scale, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent scale selection when clicking the star
    
    setFavorites(prevFavorites => {
      const isCurrentlyFavorite = prevFavorites.includes(scale.name);
      
      if (isCurrentlyFavorite) {
        return prevFavorites.filter(name => name !== scale.name);
      } else {
        return [...prevFavorites, scale.name];
      }
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setLocalSearchTerm('');
    setNoteCount(null);
    setSortBy('name');
    setSortDirection('asc');
    setShowOnlyFavorites(false);
    setShowFilterDropdown(false);
  };
  
  // Keyboard shortcut for favoriting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in a text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Toggle favorite with 'f' key
      if (e.key.toLowerCase() === 'f' && scales.length > 0 && selectedIndex >= 0 && selectedIndex < scales.length) {
        toggleFavorite(scales[selectedIndex]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scales, selectedIndex]);
  
  // Scroll to selected scale to keep it in view
  const scrollToSelected = (element: HTMLLIElement | null) => {
    if (element && scrollToStart && listRef.current) {
      // Get positions
      const listRect = listRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate if element is outside the visible area of the list
      const isAbove = elementRect.top < listRect.top;
      const isBelow = elementRect.bottom > listRect.bottom;
      
      if (isAbove || isBelow) {
        // Only scroll the list element, not the entire page
        listRef.current.scrollTop = isAbove
          ? element.offsetTop - listRef.current.offsetTop
          : element.offsetTop - listRef.current.offsetTop - listRect.height + elementRect.height;
      }
      
      // Only scroll once after initial render or scale selection
      setScrollToStart(false);
    }
  };
  
  // Reset scrollToStart when selectedIndex changes
  useEffect(() => {
    setScrollToStart(true);
  }, [selectedIndex]);

  // Calculate list height
  const listHeight = 'max-h-[600px]'; // unified height regardless of mode
  const listStyle = 'p-3 hover:bg-gray-50';
  
  // Count of favorite scales
  const favoriteCount = scales.filter(scale => isScaleFavorite(scale)).length;
  
  // Check if any filters are active
  const isFilterActive = localSearchTerm !== '' || showOnlyFavorites || noteCount !== null || sortBy !== 'name' || sortDirection !== 'asc';
  
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200">
      <div className="sticky top-0 bg-indigo-50 p-3 border-b border-gray-200 z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700">
              {filteredScales.length} scale{filteredScales.length === 1 ? '' : 's'} in <span className="text-indigo-700">{familyName}</span>
            </span>
            {favorites.length > 0 && (
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                {favoriteCount} favorite{favoriteCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
              {filteredScales.length > 0 ? `${selectedIndex + 1} of ${filteredScales.length}` : '0 of 0'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Favorites filter */}
            {favorites.length > 0 && (
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`flex items-center text-xs rounded-full transition-colors px-2 py-1 ${
                  showOnlyFavorites
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {showOnlyFavorites ? 'Show all scales' : 'Show favorites only'}
              </button>
            )}
            
            {/* Filter button with dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center text-xs rounded-full transition-colors px-2 py-1 ${
                  isFilterActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters {isFilterActive && <span className="ml-1 w-2 h-2 bg-indigo-500 rounded-full inline-block"></span>}
              </button>
              
              {showFilterDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-md shadow-lg z-20 border border-gray-200 overflow-hidden">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Filter Scales</h3>
                      {isFilterActive && (
                        <button
                          onClick={resetFilters}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Reset
                        </button>
                      )}
                    </div>
                    
                    {/* Family selection dropdown */}
                    <div className="mb-3">
                      <label htmlFor="family-filter" className="block text-xs font-medium text-gray-700 mb-1">
                        Scale Family
                      </label>
                      <select
                        id="family-filter"
                        className="w-full pl-3 pr-8 py-1.5 text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        value={selectedFamily}
                        onChange={(e) => onFamilyChange(e.target.value)}
                      >
                        {families.map(family => (
                          <option key={family} value={family}>
                            {scaleData?.families[family]?.name || family}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Search box */}
                    <div className="mb-3">
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-8 pr-3 py-1.5 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Search scales..."
                          value={localSearchTerm}
                          onChange={(e) => setLocalSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Note count filter */}
                    <div className="mb-3">
                      <label htmlFor="noteCount" className="block text-xs font-medium text-gray-700 mb-1">
                        Number of notes
                      </label>
                      <select
                        id="noteCount"
                        className="w-full pl-3 pr-8 py-1.5 text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        value={noteCount === null ? 'all' : noteCount.toString()}
                        onChange={(e) => setNoteCount(e.target.value === 'all' ? null : parseInt(e.target.value))}
                      >
                        <option value="all">Any number of notes</option>
                        {[5, 6, 7, 8, 9, 10, 11, 12].map(count => (
                          <option key={count} value={count}>
                            {count} notes
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Sort options */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label htmlFor="sortBy" className="block text-xs font-medium text-gray-700 mb-1">
                          Sort by
                        </label>
                        <select
                          id="sortBy"
                          className="w-full pl-3 pr-8 py-1.5 text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'noteCount' | 'brightness')}
                        >
                          <option value="name">Name</option>
                          <option value="noteCount">Number of Notes</option>
                          <option value="brightness">Brightness</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="sortDirection" className="block text-xs font-medium text-gray-700 mb-1">
                          Direction
                        </label>
                        <select
                          id="sortDirection"
                          className="w-full pl-3 pr-8 py-1.5 text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                          value={sortDirection}
                          onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Apply button */}
                    <button
                      onClick={() => setShowFilterDropdown(false)}
                      className="w-full mt-2 px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Keyboard shortcut hint */}
          <span className="text-xs text-gray-500 hidden sm:inline-block">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono text-xs">F</kbd> to favorite
          </span>
        </div>
        
        {/* Active filters display */}
        {isFilterActive && (
          <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500">Active filters:</span>
            
            {localSearchTerm && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {localSearchTerm}
                <button 
                  onClick={() => setLocalSearchTerm('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            
            {noteCount !== null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {noteCount} notes
                <button 
                  onClick={() => setNoteCount(null)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            
            {(sortBy !== 'name' || sortDirection !== 'asc') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Sort: {sortBy === 'name' ? 'Name' : sortBy === 'noteCount' ? 'Notes' : 'Brightness'} 
                ({sortDirection === 'asc' ? '↑' : '↓'})
                <button 
                  onClick={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                  }}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {filteredScales.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {showOnlyFavorites ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-yellow-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="text-sm">No favorites in this scale family</p>
              <p className="text-xs mt-1">Click the star icon next to a scale to add it to favorites</p>
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="mt-3 text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded hover:bg-yellow-200 transition-colors"
              >
                Show all scales
              </button>
            </>
          ) : isFilterActive ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <p className="text-sm">No scales match your filters</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
              <button
                onClick={resetFilters}
                className="mt-3 text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200 transition-colors"
              >
                Reset all filters
              </button>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No scales match your criteria</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </>
          )}
        </div>
      ) : (
        <ul 
          ref={listRef}
          className={`divide-y divide-gray-200 ${listHeight} overflow-y-auto`}
        >
          {filteredScales.map((scale, index) => {
            const isFavorite = isScaleFavorite(scale);
            const isSelected = index === selectedIndex;
            
            return (
              <li 
                key={`${scale.name}-${index}`}
                ref={index === selectedIndex ? scrollToSelected : null}
                className={`${listStyle} cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                    : 'border-l-4 border-transparent'
                } ${isFavorite ? 'bg-yellow-50/40' : ''}`}
              onClick={() => onSelectScale(scale, index)}
            >
                <div className="flex flex-col gap-3">
                  {/* Top section with name, favorite, and play button */}
              <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <h3 className={`text-base font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {scale.name}
                  </h3>
                      <button
                        onClick={(e) => toggleFavorite(scale, e)}
                        className={`ml-2 p-1 rounded-full transition-colors ${
                          isFavorite
                            ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100'
                            : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'
                        }`}
                        title={isFavorite ? "Remove from favorites (press F)" : "Add to favorites (press F)"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    </div>
                    
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent re-selecting the scale
                          playScale();
                        }}
                        disabled={!isLoaded || isPlaying}
                        className={`p-2 rounded-full transition-colors ${
                          isPlaying
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                        title={isPlaying ? "Playing..." : "Play Scale"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Description - always show a preview, show full when selected */}
                  {scale.description && (
                    <p className={`text-sm text-gray-600 ${isSelected ? '' : 'line-clamp-2'}`}>
                      {scale.description}
                    </p>
                  )}
                  
                  {/* Basic info for all scales */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {scale.degrees.length - 1} notes
                    </span>
                    {scale.categories && Object.entries(scale.categories).slice(0, isSelected ? 20 : 2).map(([category, values]) => (
                      <span key={category} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {formatName(category)}: {values[0]}
                      </span>
                    ))}
                    {scale.properties && Object.entries(scale.properties).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {formatName(key)}: {value.toString()}
                      </span>
                    ))}
                  </div>
                  
                  {/* Scale intervals for all scales */}
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-mono whitespace-nowrap">
                    {scale.intervals.join('-')}
                  </div>
                  
                  {/* Extended info only for selected scale */}
                  {isSelected && (
                    <div className="mt-1 space-y-4">
                      
                      {/* Visual representation of scale */}
                      <div className="m1-3 w-full h-6 relative bg-gray-100 rounded overflow-hidden">
                        {scale.degrees.map((degree, i) => {
                          // Convert degree to position
                          const position = (degree % 12) / 12;
                          return (
                            <div
                              key={`note-${i}`}
                              className="absolute w-2 h-6 bg-indigo-500 rounded-sm" 
                              style={{ 
                                left: `calc(${position * 100}% - 3px)`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Scale visual preview (mini version) for non-selected scales */}
                  {!isSelected && (
                    <div className="mt-2 w-full h-3 relative bg-gray-100 rounded-sm overflow-hidden">
                      {scale.degrees.map((degree, i) => {
                        // Convert degree to position
                        const position = (degree % 12) / 12;
                        return (
                          <div
                            key={`note-${i}`}
                            className="absolute w-1.5 h-3 bg-indigo-500 rounded-sm" 
                            style={{ 
                              left: `calc(${position * 100}% - 2px)`,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ScaleList; 