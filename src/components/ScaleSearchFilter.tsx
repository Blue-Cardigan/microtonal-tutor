import React from 'react';
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
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Search & Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Scales
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-gray-800"
              placeholder="Search by name, description, or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Note Count Filter */}
        <div>
          <label htmlFor="noteCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Notes
          </label>
          <select
            id="noteCount"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
        
        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'noteCount' | 'brightness')}
          >
            <option value="name">Name</option>
            <option value="noteCount">Number of Notes</option>
            <option value="brightness">Brightness</option>
          </select>
        </div>
        
        {/* Sort Direction */}
        <div>
          <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">
            Sort Direction
          </label>
          <select
            id="sortDirection"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Found {filteredScalesCount} scales matching your criteria
        </div>
        
        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ScaleSearchFilter; 