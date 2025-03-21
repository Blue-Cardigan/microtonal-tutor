import React from 'react';
import { Scale } from '../types/scale';

interface AdvancedScaleSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  availableCategories: string[];
  noteCount: number | null;
  setNoteCount: (count: number | null) => void;
  sortBy: 'name' | 'noteCount' | 'brightness';
  setSortBy: (sort: 'name' | 'noteCount' | 'brightness') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  filteredScalesCount: number;
  resetFilters: () => void;
  scales: Scale[];
}

const AdvancedScaleSearch: React.FC<AdvancedScaleSearchProps> = ({
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
  resetFilters,
  scales
}) => {
  // Extract unique properties from scales for filtering
  const uniqueProperties = React.useMemo(() => {
    const properties = new Set<string>();
    scales.forEach(scale => {
      if (scale.properties) {
        Object.keys(scale.properties).forEach(prop => properties.add(prop));
      }
    });
    return Array.from(properties);
  }, [scales]);

  // Extract unique note counts
  const uniqueNoteCounts = React.useMemo(() => {
    const counts = new Set<number>();
    scales.forEach(scale => {
      counts.add(scale.degrees.length - 1);
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [scales]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
      {/* Search and Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Bar */}
        <div className="md:col-span-2">
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scales..."
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Note Count and Sort Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Note Count Filter */}
        <div>
          <select
            id="noteCount"
            value={noteCount || ''}
            onChange={(e) => setNoteCount(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any Note Count</option>
            {uniqueNoteCounts.map(count => (
              <option key={count} value={count}>
                {count} notes
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'noteCount' | 'brightness')}
            className="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="name">Name</option>
            <option value="noteCount">Note Count</option>
            <option value="brightness">Brightness</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            title={sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
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
      </div>

      {/* Property Filters */}
      {uniqueProperties.length > 0 && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uniqueProperties.map(prop => (
              <label key={prop} className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="form-checkbox h-3 w-3 text-indigo-600"
                  checked={selectedCategory === prop}
                  onChange={() => setSelectedCategory(selectedCategory === prop ? 'all' : prop)}
                />
                <span className="ml-1.5 text-gray-700">{prop}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Results and Reset */}
      <div className="flex justify-between items-center pt-1">
        <span className="text-xs text-gray-600">
          {filteredScalesCount} scales found
        </span>
        <button
          onClick={resetFilters}
          className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default AdvancedScaleSearch; 