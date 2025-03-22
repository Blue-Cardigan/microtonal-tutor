import React, { useState } from 'react';
import { formatName } from '../utils/IntervalUtils';

interface ScaleSearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  availableCategories: string[];
  noteCount: number | null;
  setNoteCount: (count: number | null) => void;
  sortBy: 'name' | 'noteCount' | 'brightness';
  setSortBy: (sortBy: 'name' | 'noteCount' | 'brightness') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  filteredScalesCount: number;
  resetFilters: () => void;
}

const ScaleSearchFilter: React.FC<ScaleSearchFilterProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  availableCategories,
  noteCount,
  setNoteCount,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  filteredScalesCount,
  resetFilters
}) => {
  // Local state for collapsible sections
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Filter categories that have been selected
  const selectedCategories = selectedCategory === 'all' ? [] : [selectedCategory];
  
  // Create a badge for the note count
  const noteCountBadge = noteCount !== null ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
      {noteCount} notes
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setNoteCount(null);
        }}
        className="ml-1 text-indigo-500 hover:text-indigo-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  ) : null;
  
  return (
    <div className="bg-gray-50 rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Search & Filter</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Found <span className="font-medium">{filteredScalesCount}</span> scales
          </span>
          <button
            onClick={resetFilters}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reset
          </button>
        </div>
      </div>
      
      {/* Search Input with Clear Button */}
      <div className="mb-4">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md text-gray-800"
            placeholder="Search scales by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={handleClearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Filters */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {/* Category Pills */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              
              {availableCategories.slice(0, 5).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formatName(category)}
                </button>
              ))}
              
              {availableCategories.length > 5 && (
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center"
                  >
                    More
                    <svg
                      className={`ml-1 h-3 w-3 transition-transform ${showAdvancedFilters ? 'transform rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Note Count */}
          <div>
            <label htmlFor="noteCount" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <select
              id="noteCount"
              className="w-full pl-3 pr-8 py-1 text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              value={noteCount === null ? 'all' : noteCount.toString()}
              onChange={(e) => setNoteCount(e.target.value === 'all' ? null : parseInt(e.target.value))}
            >
              <option value="all">Any</option>
              {[5, 6, 7, 8, 9, 10, 11, 12].map(count => (
                <option key={count} value={count}>
                  {count} notes
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Active Filters */}
      {(selectedCategories.length > 0 || noteCount !== null) && (
        <div className="mb-4 p-2 bg-gray-100 rounded-md">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-500 mr-2">Active filters:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedCategories.map(category => (
                <span key={category} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {formatName(category)}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 text-indigo-500 hover:text-indigo-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
              {noteCountBadge}
            </div>
          </div>
        </div>
      )}
      
      {/* Advanced Filters (Collapsible) */}
      {showAdvancedFilters && (
        <div className="mb-4 p-3 bg-gray-100 rounded-md border border-gray-200 animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories (continued) */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                All Categories
              </label>
              <select
                id="category"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {formatName(category)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort Options */}
            <div>
              <label htmlFor="sortOptions" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Options
              </label>
              <div className="flex space-x-2">
                <select
                  id="sortBy"
                  className="flex-1 pl-3 pr-8 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'noteCount' | 'brightness')}
                >
                  <option value="name">Name</option>
                  <option value="noteCount">Number of Notes</option>
                  <option value="brightness">Brightness</option>
                </select>
                
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className={`px-3 py-1 rounded border ${
                    sortDirection === 'asc'
                      ? 'bg-gray-50 text-gray-700 border-gray-300'
                      : 'bg-gray-700 text-white border-gray-700'
                  }`}
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortDirection === 'asc' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0V8.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L13 8.414V16z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScaleSearchFilter; 